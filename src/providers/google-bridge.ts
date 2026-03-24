import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';

export type SheetValue = string | number | boolean | null;

export interface BridgeRequest {
  action: 'GET_VALUES' | 'UPDATE_VALUES' | 'APPEND_VALUES' | 'SETUP';
  spreadsheetId: string;
  secret?: string;
  tab?: string;
  range?: string;
  values?: SheetValue[][];
  headers?: Record<string, string[]>;
}

export interface BridgeResponse<T = unknown> {
  isSuccess: boolean;
  error?: string;
  data?: T;
}

export class GoogleBridgeClient {
  private static instance: GoogleBridgeClient;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = env.APPS_SCRIPT_URL;
  }

  public static getInstance(): GoogleBridgeClient {
    if (!GoogleBridgeClient.instance) {
      GoogleBridgeClient.instance = new GoogleBridgeClient();
    }
    return GoogleBridgeClient.instance;
  }

  public async request<T = unknown>(payload: BridgeRequest): Promise<BridgeResponse<T>> {
    try {
      const securePayload = { ...payload, secret: env.BRIDGE_SECRET };

      const response = await axios.post(this.baseUrl, securePayload, {
        timeout: 45000,
      });

      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error(
          '❌ Erro: O Apps Script retornou HTML. Verifique se a URL está correta e implantada como Web App.'
        );
      }

      const bridgeRes = response.data as BridgeResponse<T>;

      if (bridgeRes.isSuccess === false) {
        logger.error(`[Google Bridge] Erro: ${bridgeRes.error || 'Desconhecido'}`);
      }

      return bridgeRes;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('❌ Erro: Conexão com o Google excedeu o tempo limite (45s).');
        }
      }
      throw error;
    }
  }

  public async getValues(tab: string, range: string): Promise<SheetValue[][]> {
    const response = await this.request<SheetValue[][]>({
      action: 'GET_VALUES',
      spreadsheetId: env.SPREADSHEET_ID,
      tab,
      range,
    });
    return response.data || [];
  }

  public async updateValues(
    tab: string,
    range: string,
    values: SheetValue[][],
    isAppend = false
  ): Promise<void> {
    const response = await this.request({
      action: isAppend ? 'APPEND_VALUES' : 'UPDATE_VALUES',
      spreadsheetId: env.SPREADSHEET_ID,
      tab,
      range: range || 'A1',
      values,
    });

    if (!response.isSuccess) {
      throw new Error(`Google Script Update Error: ${response.error}`);
    }
  }
}

export const bridge = GoogleBridgeClient.getInstance();
