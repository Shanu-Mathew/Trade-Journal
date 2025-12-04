export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_type: string;
          currency: string;
          initial_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>;
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          symbol: string;
          instrument_type: string;
          direction: 'long' | 'short';
          quantity: number;
          leverage: number | null;
          entry_price: number;
          exit_price: number | null;
          entry_timestamp: string;
          exit_timestamp: string | null;
          fees: number;
          commission: number;
          slippage: number;
          tags: string[];
          strategy: string | null;
          notes: string | null;
          profit_loss: number | null;
          profit_loss_percent: number | null;
          r_multiple: number | null;
          status: 'open' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trades']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trades']['Insert']>;
      };
      trade_screenshots: {
        Row: {
          id: string;
          trade_id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trade_screenshots']['Row'], 'id' | 'uploaded_at'>;
        Update: Partial<Database['public']['Tables']['trade_screenshots']['Insert']>;
      };
      trade_ohlc_data: {
        Row: {
          id: string;
          trade_id: string;
          timestamp: string;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number | null;
        };
        Insert: Omit<Database['public']['Tables']['trade_ohlc_data']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['trade_ohlc_data']['Insert']>;
      };
      journals: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          folder_id: string | null;
          title: string;
          content: string;
          linked_trade_ids: string[];
          entry_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['journals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['journals']['Insert']>;
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          title: string;
          body: string;
          is_bulleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['strategies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['strategies']['Insert']>;
      };
      journal_folders: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['journal_folders']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['journal_folders']['Insert']>;
      };
      journal_attachments: {
        Row: {
          id: string;
          journal_id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['journal_attachments']['Row'], 'id' | 'uploaded_at'>;
        Update: Partial<Database['public']['Tables']['journal_attachments']['Insert']>;
      };
      filter_presets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filters: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['filter_presets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['filter_presets']['Insert']>;
      };
      csv_mapping_presets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          mapping: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['csv_mapping_presets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['csv_mapping_presets']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          action: 'create' | 'update' | 'delete';
          changes: Record<string, any>;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
    };
  };
}
