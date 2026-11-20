// Same shapes as openapi.yaml.
export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type FacilityType = 'POOL' | 'GYM' | 'FOOTBALL' | 'BASKETBALL';

export type User = { id: string; name: string; email: string; role: Role; blocked: boolean };
export type UserSummary = { id: string; name: string };

export type Unit = { id: string; name: string };
export type Facility = {
  id: string;
  name: string;
  type: FacilityType;
  openTime: string;
  closeTime: string;
  capacityPerSlot: number;
  studentDailyLimitMinutes: number;
  units: Unit[];
};

export type SlotStatus = 'FREE' | 'FULL' | 'MAINTENANCE' | 'RESTRICTED' | 'PAST';
export type Slot = {
  unitId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  status: SlotStatus;
  bookedBy: UserSummary[];
};

export type BookingStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
export type Booking = {
  id: string;
  user: UserSummary;
  facilityId: string;
  facilityName: string;
  unitId: string;
  unitName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  cancelledBy: 'USER' | 'ADMIN' | 'MAINTENANCE' | null;
  createdAt: string;
};

export type DailyLimit = {
  date: string;
  limitMinutes: number | null;
  usedMinutes: number;
  remainingMinutes: number | null;
};

export type MaintenanceRange = { unitId?: string; startsAt: string; endsAt: string };
export type MaintenanceBlock = {
  id: string;
  facilityId: string;
  unitId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  createdBy: UserSummary;
};

export type Session = { token: string; user: User };
export type BookingCreate = { unitId: string; date: string; startTime: string; endTime: string };
