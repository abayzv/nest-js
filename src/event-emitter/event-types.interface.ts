export interface EventPayloads {
    'user.registered': { name: string; email: string, url: string };
    'user.reset-password': { name: string; email: string; link: string };
    'user.verify-email': { name: string; email: string; otp: string };
}