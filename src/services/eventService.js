/**
 * VIBRA - Event Service
 * Module: Events
 * 
 * Handles all event operations:
 * - Create events
 * - Host events
 * - RSVP to events
 * - Get event feed
 * - Event messaging
 * - Entry gifts
 * - Private event invites
 * 
 * All API calls are mocked. Replace with real endpoints when available.
 */

// Storage keys
const EVENTS_KEY = 'vibra_events';
const RSVPS_KEY = 'vibra_rsvps';

// Mock event database
let MOCK_EVENTS = {};
let MOCK_RSVPS = {};

// Load from localStorage
try {
  const saved = localStorage.getItem(EVENTS_KEY);
  if (saved) MOCK_EVENTS = JSON.parse(saved);
} catch {}

try {
  const saved = localStorage.getItem(RSVPS_KEY);
  if (saved) MOCK_RSVPS = JSON.parse(saved);
} catch {}

// Event types
export const EVENT_TYPES = {
  OPEN: 'open',
  PRIVATE: 'private',
  VERIFIED: 'verified',
};

/**
 * Create an event
 * @param {string} hostId - Host user ID
 * @param {Object} eventData - Event details
 * @returns {Promise<Object>} Created event
 */
export const createEvent = async (hostId, eventData) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!eventData.title || !eventData.date || !eventData.time || !eventData.location) {
    throw new Error('Missing required fields: title, date, time, location');
  }

  const eventDate = new Date(`${eventData.date}T${eventData.time}`);
  if (eventDate < new Date()) {
    throw new Error('Event date must be in the future');
  }

  const event = {
    id: `event_${Date.now()}`,
    hostId,
    title: eventData.title.trim(),
    description: eventData.description || '',
    date: eventData.date,
    time: eventData.time,
    location: eventData.location,
    maxGuests: eventData.maxGuests || 50,
    type: eventData.type || EVENT_TYPES.OPEN,
    entryGift: eventData.entryGift || null,
    entryGiftPrice: eventData.entryGiftPrice || 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attendees: [],
    attendeeCount: 0,
    isVerified: eventData.type === EVENT_TYPES.VERIFIED,
    invitedUsers: eventData.invitedUsers || [],
  };

  MOCK_EVENTS[event.id] = event;
  saveEvents();

  return event;
};

/**
 * Update an existing event
 * @param {string} eventId - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated event
 */
export const updateEvent = async (eventId, updates) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const event = MOCK_EVENTS[eventId];
  if (!event) {
    throw new Error('Event not found');
  }

  const updatedEvent = {
    ...event,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  MOCK_EVENTS[eventId] = updatedEvent;
  saveEvents();

  return updatedEvent;
};

/**
 * Get all events (feed)
 * @param {string} userId - Current user ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} List of events
 */
export const getEvents = async (userId, filters = {}) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let events = Object.values(MOCK_EVENTS);

  events = events.filter(e => e.status === 'active');

  if (filters.type) {
    if (filters.type === 'open') {
      events = events.filter(e => e.type === EVENT_TYPES.OPEN);
    } else if (filters.type === 'private') {
      events = events.filter(e => e.type === EVENT_TYPES.PRIVATE);
    } else if (filters.type === 'verified') {
      events = events.filter(e => e.type === EVENT_TYPES.VERIFIED);
    }
  }

  if (filters.date) {
    events = events.filter(e => e.date === filters.date);
  }

  if (filters.location) {
    events = events.filter(e => 
      e.location.toLowerCase().includes(filters.location.toLowerCase())
    );
  }

  if (filters.minAttendees) {
    events = events.filter(e => e.attendeeCount >= filters.minAttendees);
  }

  events.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA - dateB;
  });

  for (const event of events) {
    const rsvp = await getRSVP(event.id, userId);
    event.userRSVP = rsvp;
  }

  return events;
};

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event data
 */
export const getEvent = async (eventId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const event = MOCK_EVENTS[eventId];
  if (!event) {
    throw new Error('Event not found');
  }

  return event;
};

/**
 * RSVP to an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} entryGiftCode - Optional entry gift code
 * @returns {Promise<Object>} RSVP result
 */
export const rsvpEvent = async (eventId, userId, entryGiftCode = null) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const event = await getEvent(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  if (event.status !== 'active') {
    throw new Error('Event is no longer active');
  }

  if (event.attendeeCount >= event.maxGuests) {
    throw new Error('Event is full');
  }

  const existing = await getRSVP(eventId, userId);
  if (existing) {
    throw new Error('You have already RSVP\'d to this event');
  }

  // Check if user is invited to private event
  if (event.type === EVENT_TYPES.PRIVATE) {
    const isInvited = event.invitedUsers?.includes(userId) || false;
    const isHost = event.hostId === userId;
    if (!isInvited && !isHost) {
      throw new Error('You are not invited to this private event');
    }
  }

  if (event.type === EVENT_TYPES.VERIFIED && event.entryGift) {
    if (!entryGiftCode) {
      throw new Error('Entry gift required for this event');
    }
    const giftValid = await validateEntryGift(entryGiftCode, event.entryGift);
    if (!giftValid) {
      throw new Error('Invalid entry gift');
    }
  }

  const rsvp = {
    id: `rsvp_${Date.now()}`,
    eventId,
    userId,
    entryGiftCode: entryGiftCode || null,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  if (!MOCK_RSVPS[eventId]) {
    MOCK_RSVPS[eventId] = [];
  }
  MOCK_RSVPS[eventId].push(rsvp);
  saveRSVPs();

  event.attendees.push(userId);
  event.attendeeCount += 1;
  MOCK_EVENTS[eventId] = event;
  saveEvents();

  return {
    success: true,
    rsvp,
    event,
  };
};

/**
 * Cancel RSVP
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result
 */
export const cancelRSVP = async (eventId, userId) => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const event = await getEvent(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const rsvpIndex = MOCK_RSVPS[eventId]?.findIndex(r => r.userId === userId);
  if (rsvpIndex === undefined || rsvpIndex === -1) {
    throw new Error('RSVP not found');
  }

  MOCK_RSVPS[eventId].splice(rsvpIndex, 1);
  saveRSVPs();

  const attendeeIndex = event.attendees.indexOf(userId);
  if (attendeeIndex !== -1) {
    event.attendees.splice(attendeeIndex, 1);
    event.attendeeCount -= 1;
  }
  MOCK_EVENTS[eventId] = event;
  saveEvents();

  return { success: true };
};

/**
 * Get RSVP for a user on an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} RSVP data
 */
export const getRSVP = async (eventId, userId) => {
  const rsvps = MOCK_RSVPS[eventId] || [];
  return rsvps.find(r => r.userId === userId) || null;
};

/**
 * Get all RSVPs for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} RSVP list
 */
export const getEventRSVPs = async (eventId) => {
  return MOCK_RSVPS[eventId] || [];
};

/**
 * Get events hosted by a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Events hosted
 */
export const getHostedEvents = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const events = Object.values(MOCK_EVENTS);
  return events.filter(e => e.hostId === userId);
};

/**
 * Get events a user is attending
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Events attending
 */
export const getAttendingEvents = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const events = Object.values(MOCK_EVENTS);
  return events.filter(e => e.attendees.includes(userId));
};

/**
 * Cancel an event
 * @param {string} eventId - Event ID
 * @param {string} hostId - Host user ID
 * @returns {Promise<Object>} Result
 */
export const cancelEvent = async (eventId, hostId) => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const event = await getEvent(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  if (event.hostId !== hostId) {
    throw new Error('Only the host can cancel this event');
  }

  event.status = 'cancelled';
  MOCK_EVENTS[eventId] = event;
  saveEvents();

  return { success: true };
};

/**
 * Validate entry gift
 * @param {string} code - Gift code
 * @param {string} giftId - Gift ID
 * @returns {Promise<boolean>} Valid or not
 */
export const validateEntryGift = async (code, giftId) => {
  return code && code.length === 6 && /^\d{6}$/.test(code);
};

/**
 * Send message to all attendees
 * @param {string} eventId - Event ID
 * @param {string} hostId - Host user ID
 * @param {string} message - Message to send
 * @returns {Promise<Object>} Result
 */
export const messageAttendees = async (eventId, hostId, message) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const event = await getEvent(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  if (event.hostId !== hostId) {
    throw new Error('Only the host can message attendees');
  }

  const attendees = event.attendees;

  return {
    success: true,
    sentTo: attendees.length,
    message,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get event stats
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Stats
 */
export const getEventStats = async (eventId) => {
  const event = await getEvent(eventId);
  const rsvps = await getEventRSVPs(eventId);

  return {
    totalAttendees: event.attendeeCount,
    totalRSVPs: rsvps.length,
    maxGuests: event.maxGuests,
    isFull: event.attendeeCount >= event.maxGuests,
    entryGiftRequired: !!event.entryGift,
  };
};

/**
 * Save events to localStorage
 */
const saveEvents = () => {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(MOCK_EVENTS));
  } catch (error) {
    console.warn('Failed to save events:', error);
  }
};

/**
 * Save RSVPs to localStorage
 */
const saveRSVPs = () => {
  try {
    localStorage.setItem(RSVPS_KEY, JSON.stringify(MOCK_RSVPS));
  } catch (error) {
    console.warn('Failed to save RSVPs:', error);
  }
};

export default {
  EVENT_TYPES,
  createEvent,
  updateEvent,
  getEvents,
  getEvent,
  rsvpEvent,
  cancelRSVP,
  getRSVP,
  getEventRSVPs,
  getHostedEvents,
  getAttendingEvents,
  cancelEvent,
  validateEntryGift,
  messageAttendees,
  getEventStats,
};