import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  uploadHtmlFile(fileName: string, fileBuffer: any) {
    throw new Error('Method not implemented.');
  }
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }

  getClient() {
    return this.supabase;
  }
}
