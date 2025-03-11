import NodeCache from 'node-cache';

// Configuración del caché
const cache = new NodeCache({
  stdTTL: 300, // 5 minutos por defecto
  checkperiod: 60 // Revisar expiración cada minuto
});

// Tipos de caché
export enum CacheKey {
  PERSONA_LIST = 'persona_list',
  PERSONA_DETAIL = 'persona_detail',
  CANTON_LIST = 'canton_list',
  CANTON_DETAIL = 'canton_detail',
  USER_PERMISSIONS = 'user_permissions'
}

interface CacheOptions {
  ttl?: number;
  key?: string;
}

export class CacheService {
  private static generateKey(baseKey: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    return `${baseKey}:${JSON.stringify(sortedParams)}`;
  }

  static async getOrSet<T>(
    key: string,
    params: Record<string, any>,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cacheKey = this.generateKey(key, params);
    const cached = cache.get<T>(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const data = await fetchFn();
    if (options.ttl !== undefined) {
      cache.set(cacheKey, data, options.ttl);
    } else {
      cache.set(cacheKey, data);
    }
    return data;
  }

  static invalidate(key: string, params: Record<string, any> = {}): void {
    const cacheKey = this.generateKey(key, params);
    cache.del(cacheKey);
  }

  static invalidatePattern(pattern: string): void {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.startsWith(pattern));
    matchingKeys.forEach(key => cache.del(key));
  }

  static async getPersonaList(params: Record<string, any>) {
    return this.getOrSet(
      CacheKey.PERSONA_LIST,
      params,
      async () => {
        // La función real de búsqueda se pasará como parámetro
        return Promise.resolve([]);
      },
      { ttl: 300 } // 5 minutos
    );
  }

  static async getPersonaDetail(id: number) {
    return this.getOrSet(
      CacheKey.PERSONA_DETAIL,
      { id },
      async () => {
        // La función real de búsqueda se pasará como parámetro
        return Promise.resolve(null);
      },
      { ttl: 600 } // 10 minutos
    );
  }

  static async getUserPermissions(userId: number) {
    return this.getOrSet(
      CacheKey.USER_PERMISSIONS,
      { userId },
      async () => {
        // La función real de búsqueda se pasará como parámetro
        return Promise.resolve([]);
      },
      { ttl: 1800 } // 30 minutos
    );
  }

  static clearPersonaCache(personaId?: number): void {
    if (personaId) {
      this.invalidate(CacheKey.PERSONA_DETAIL, { id: personaId });
    }
    this.invalidatePattern(CacheKey.PERSONA_LIST);
  }

  static clearCantonCache(cantonId?: number): void {
    if (cantonId) {
      this.invalidate(CacheKey.CANTON_DETAIL, { id: cantonId });
    }
    this.invalidatePattern(CacheKey.CANTON_LIST);
  }

  static clearUserPermissionsCache(userId: number): void {
    this.invalidate(CacheKey.USER_PERMISSIONS, { userId });
  }
} 