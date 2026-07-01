import { Server } from 'socket.io';
import { googleRouteETA } from './googlemaps.service';

interface OnlineRider {
  socketId: string;
  isBusy: boolean;
  lat?: number;
  lng?: number;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
function calculatePickupPayout(distance: number): number {
  if (distance <= 0.4) return 0;
  if (distance <= 0.6) return 1;
  if (distance <= 0.8) return 2;
  if (distance <= 1.2) return 3;
  if (distance <= 1.8) return 4;
  if (distance <= 2.4) return 5;
  if (distance <= 3.0) return 6;
  if (distance <= 3.5) return 7;
  if (distance <= 4.0) return 8;
  return 10; // Fallback for > 4.0km, though such riders should be filtered out
}

export class AssignmentManager {
  private io: Server | null = null;
  private onlineRiders: Map<string, OnlineRider> = new Map();
  private activeJobs: Map<string, Set<string>> = new Map();
  private jobTimers: Map<string, NodeJS.Timeout> = new Map();

  init(io: Server) {
    this.io = io;
  }

  registerRider(riderId: string, socketId: string, lat?: number, lng?: number) {
    this.onlineRiders.set(riderId, { socketId, isBusy: false, lat, lng });
    console.log(`[Assignment] Rider ${riderId} registered with socket ${socketId} at ${lat}, ${lng}`);
  }

  updateRiderLocation(riderId: string, lat: number, lng: number) {
    const rider = this.onlineRiders.get(riderId);
    if (rider) {
      rider.lat = lat;
      rider.lng = lng;
    }
  }

  unregisterSocket(socketId: string) {
    for (const [riderId, data] of this.onlineRiders.entries()) {
      if (data.socketId === socketId) {
        this.onlineRiders.delete(riderId);
        console.log(`[Assignment] Rider ${riderId} disconnected`);
        break;
      }
    }
  }

  startJobRing(jobPayload: any, _ringDurationMs: number = 120000) {
    const jobId = jobPayload.id;
    this.activeJobs.set(jobId, new Set());
    this.broadcastJob(jobPayload);
  }

  private async broadcastJob(jobPayload: any) {
    if (!this.activeJobs.has(jobPayload.id)) return;

    const notifiedRiders = this.activeJobs.get(jobPayload.id)!;

    const totalAvailable = Array.from(this.onlineRiders.entries()).filter(([rId, data]) => !data.isBusy);
    const availableRiders = totalAvailable.filter(([rId, data]) => !notifiedRiders.has(rId));

    // If there is only 1 rider online, do NOT revoke. Just re-notify them.
    const isSingleRider = totalAvailable.length === 1;

    // Revoke from previously notified rider if they ignored it, UNLESS they are the only rider
    if (notifiedRiders.size > 0 && this.io && !isSingleRider) {
      for (const riderId of notifiedRiders) {
        const riderData = this.onlineRiders.get(riderId);
        if (riderData) {
          this.io.to(riderData.socketId).emit('job_revoked', { id: jobPayload.id });
        }
      }
    }

    // Calculate distance for each available rider
    const stallLat = jobPayload.stallLat || jobPayload.stall?.lat || 25.611;
    const stallLng = jobPayload.stallLng || jobPayload.stall?.lng || 85.130;
    
    let ridersWithDistance = availableRiders.map(([riderId, data]) => {
      // Default to a large distance if no GPS available
      let distance = 999999;
      if (data.lat && data.lng) {
        distance = getDistance(stallLat, stallLng, data.lat, data.lng);
      }
      return { riderId, data, distance };
    });

    // 1. Max Radius (4.0 km)
    ridersWithDistance = ridersWithDistance.filter(r => r.distance <= 4.0);

    // 2. Under 1.8 km Priority
    const hasRiderUnder1_8km = ridersWithDistance.some(r => r.distance <= 1.8);
    if (hasRiderUnder1_8km) {
      ridersWithDistance = ridersWithDistance.filter(r => r.distance <= 1.8);
    }

    if (ridersWithDistance.length === 0) {
      if (totalAvailable.length === 0) {
        console.log(`[Assignment] No riders online for job ${jobPayload.id}. Retrying in 10s.`);
        this.jobTimers.set(jobPayload.id, setTimeout(() => this.broadcastJob(jobPayload), 10000));
        return;
      }
      console.log(`[Assignment] No eligible riders within range for job ${jobPayload.id}. Restarting loop.`);
      notifiedRiders.clear(); // reset and try again from the start
      this.jobTimers.set(jobPayload.id, setTimeout(() => this.broadcastJob(jobPayload), 2000));
      return;
    }

    // Sort by nearest
    ridersWithDistance.sort((a, b) => a.distance - b.distance);
    const nearestRider = ridersWithDistance[0];

    // Calculate real distance using Google Maps for accurate payout
    let actualPickupDistance = nearestRider.distance;
    try {
      if (nearestRider.data.lat && nearestRider.data.lng && stallLat && stallLng) {
        const googleRes = await googleRouteETA(nearestRider.data.lat, nearestRider.data.lng, stallLat, stallLng);
        if (googleRes && googleRes.distanceKm) {
          actualPickupDistance = googleRes.distanceKm;
        }
      }
    } catch (error) {
      console.error("[Assignment] Google Maps Route failed for pickup distance, using haversine fallback", error);
    }

    // Emit ONLY to the nearest rider
    notifiedRiders.add(nearestRider.riderId);
    
    // Calculate pickup payout based on actual shortest road distance
    const pickupPayout = calculatePickupPayout(actualPickupDistance);

    // Inject exact pickup distance and payout
    const jobWithDistance = { 
      ...jobPayload, 
      pickupDistance: parseFloat(actualPickupDistance.toFixed(1)),
      pickupPayout: pickupPayout
    };
    
    if (this.io) {
      this.io.to(nearestRider.data.socketId).emit('job_offer', jobWithDistance);
    }
    
    console.log(`[Assignment] Job ${jobPayload.id} offered to nearest rider ${nearestRider.riderId} (Distance: ${actualPickupDistance.toFixed(2)} km)`);
    
    // If not accepted in 300 seconds, try the next rider
    this.jobTimers.set(jobPayload.id, setTimeout(() => {
      console.log(`[Assignment] Rider ${nearestRider.riderId} ignored job ${jobPayload.id}, trying next nearest...`);
      this.broadcastJob(jobPayload); // original payload without distance, distance will be recalculated for the next rider
    }, 300000));
  }

  acceptJob(jobId: string, acceptedByRiderId: string) {
    if (!this.activeJobs.has(jobId)) return false;

    if (this.jobTimers.has(jobId)) {
      clearTimeout(this.jobTimers.get(jobId)!);
      this.jobTimers.delete(jobId);
    }

    const notifiedRiders = this.activeJobs.get(jobId)!;
    
    for (const riderId of notifiedRiders) {
      if (riderId !== acceptedByRiderId) {
        const riderData = this.onlineRiders.get(riderId);
        if (riderData && this.io) {
          this.io.to(riderData.socketId).emit('job_revoked', { id: jobId });
          console.log(`[Assignment] Job ${jobId} revoked from Rider ${riderId}`);
        }
      }
    }

    this.activeJobs.delete(jobId);
    
    const accepter = this.onlineRiders.get(acceptedByRiderId);
    if (accepter) accepter.isBusy = true;

    return true;
  }

  markRiderAvailable(riderId: string) {
    const rider = this.onlineRiders.get(riderId);
    if (rider) {
      rider.isBusy = false;
      console.log(`[Assignment] Rider ${riderId} marked as available.`);
    }
  }

  revokeJob(jobId: string) {
    if (!this.activeJobs.has(jobId)) return;
    
    if (this.jobTimers.has(jobId)) {
      clearTimeout(this.jobTimers.get(jobId)!);
      this.jobTimers.delete(jobId);
    }

    const notifiedRiders = this.activeJobs.get(jobId)!;
    for (const riderId of notifiedRiders) {
      const riderData = this.onlineRiders.get(riderId);
      if (riderData && this.io) {
        this.io.to(riderData.socketId).emit('job_revoked', { id: jobId });
      }
    }
    
    this.activeJobs.delete(jobId);
  }
}

export const assignmentManager = new AssignmentManager();
