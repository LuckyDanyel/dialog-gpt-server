import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export default class CookieService {
    constructor() {
    }

    public set(response: Response, key: string, value: string, options: { expires: number }) {
        response.cookie(key, value, { 
            httpOnly: true, 
            secure: true, 
            domain: process.env.SERVER_DOMAIN,
            partitioned: true,
            maxAge: 31536000,
            sameSite: 'none', 
            expires: new Date(Date.now() + options.expires)
        });
    }

}
