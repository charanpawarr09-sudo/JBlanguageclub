export const ROUTES = {
  HOME: '/',
  EVENTS: '/events',
  EVENT_DETAIL: '/events/:id',
  SCHEDULE: '/schedule',
  REGISTER: '/register',
  REGISTER_SUCCESS: '/register/success',
  CONTACT: '/contact',
  ABOUT: '/about',
  TEAM_PROFILE: '/about/team/:id',
  PAST_EVENT_DETAIL: '/about/past-events/:id',
  ADMIN: '/admin',
  ADMIN_LOGIN: '/admin/login',
  NOT_FOUND: '*',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
