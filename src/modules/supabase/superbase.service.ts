import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  async uploadHtmlFile(fileName: string, fileBuffer: Buffer) {
    const { error } = await this.supabase.storage
      .from('blogs')
      .upload(fileName, fileBuffer, {
        contentType: 'text/html',
        upsert: true,
      });

    if (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }
}
