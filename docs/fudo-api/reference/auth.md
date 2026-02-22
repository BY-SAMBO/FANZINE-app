# Autenticacion Fudo

## API Principal (v1alpha1)

**Auth endpoint:**
- Produccion: `POST https://auth.fu.do/api`
- Staging: `POST https://auth.staging.fu.do/api`

**Request:**
```json
{ "apiKey": "TU_API_KEY", "apiSecret": "TU_API_SECRET" }
```

**Response:**
```json
{ "token": "1234567890", "exp": 1645387452 }
```

- `exp` = Unix timestamp (segundos). **NO es `expiresIn`** (duracion).
- Token dura **24 horas**.
- Header: `Authorization: Bearer <token>`

**Servidores API:**
| Ambiente | URL |
|----------|-----|
| Produccion | `https://api.fu.do/v1alpha1` |
| Staging | `https://api.staging.fu.do/v1alpha1` |

---

## API de Integraciones (Orders/Delivery)

**Auth endpoint:**
- Produccion: `POST https://integrations.fu.do/fudo/auth`
- Staging: `POST https://integrations.staging.fu.do/fudo/auth`

**Request:**
```json
{ "clientId": "ABcdEf", "clientSecret": "1234ASDF1234ASDF1234" }
```

- Se obtienen creando "External Application" en Fudo Admin > Administration > External Applications.
- Header diferente: `Fudo-External-App-Authorization: Bearer <token>`

**Servidores API:**
| Ambiente | URL |
|----------|-----|
| Produccion | `https://integrations.fu.do/fudo` |
| Staging | `https://integrations.staging.fu.do/fudo` |

---

## Gotchas conocidos

- El auth URL de la API principal es `https://auth.fu.do/api` (no `/auth/api` ni `/api/auth`). El client.ts de FANZINE ya lo tiene corregido.
- La respuesta usa `exp` (timestamp), no `expiresIn` (duracion). Bug corregido en client.ts.
- Credenciales en `.env.local`: `FUDO_API_KEY`, `FUDO_API_SECRET`

---

## Paginacion (API Principal)

```
?page[size]=500&page[number]=1
```

- Default: 250 items, pagina 1
- Maximo: 500 items por pagina
- No hay total count. Paginar hasta que `count < page[size]`.

## Filtros (API Principal)

```
?filter[campo]=operador.valor
```

Operadores: `eq`, `gte`, `lte`, `gt`, `lt`, `in`, `ilike`, `fts`, `is`, `isdistinct`

Combinados: `and(gte.valor1,lte.valor2)`

Full-text: `filter[@all]=fts.texto`
