// src/supabase/supabase.module.ts
import { Module } from '@nestjs/common';
import { SupabaseService } from '../blog/supabase.service';

@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
