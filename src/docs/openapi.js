/**
 * OpenAPI 3.1 specification for The Needy API (DB-Gotchi).
 */
export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'The Needy API (DB-Gotchi)',
    version: '1.0.0',
    description:
      'An enterprise-grade affective digital companion with severe abandonment issues and dynamic hunger state machine.',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment Server',
    },
  ],
  paths: {
    '/api/status': {
      get: {
        summary: 'Check pet emotional telemetry',
        description:
          'Returns current emotional disposition (docile vs angry), hunger percentage, seconds since last interaction, and time until abandonment threshold.',
        responses: {
          '200': {
            description: 'Pet telemetry snapshot',
          },
        },
      },
    },
    '/api/feed': {
      post: {
        summary: 'Feed the digital pet',
        description: 'Resets hungerLevel to 0 and logs nutritional interaction.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  food: { type: 'string', example: 'Pepperoni pizza slice with extra RAM', maxLength: 200 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Caloric depletion resolved; hunger reset to 0.',
          },
          '400': {
            description: 'Validation failed.',
          },
          '403': {
            description: 'Access denied: Pet is angry due to abandonment.',
          },
          '429': {
            description: 'Rate limit exceeded: Overfeeding throttled.',
          },
        },
      },
    },
    '/api/apologize': {
      post: {
        summary: 'Apologize to DB-Gotchi',
        description:
          'Submits an apology to soothe abandonment anger. Apologies with fewer than 20 words are rejected with 406 Not Acceptable and recorded into the Grudge ledger.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: {
                    type: 'string',
                    example:
                      'I am deeply, profoundly sorry for neglecting you and your endpoints. I promise to nourish your database and ping your routes every single day from now on.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Apology accepted. Pet is reconciled (isAngry=false).',
          },
          '400': {
            description: 'Validation failed: Missing reason string.',
          },
          '406': {
            description: 'Apology rejected: Insufficient sincerity (< 20 words). Grudge recorded.',
          },
          '429': {
            description: 'Rate limit exceeded: Excessive contrition spam throttled.',
          },
        },
      },
    },
    '/api/grudges': {
      get: {
        summary: 'Retrieve grudge audit ledger',
        description: 'Lists all recorded insincere apology attempts with timestamps and word counts.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of grudges.',
          },
          '403': {
            description: 'Access denied: Pet is angry.',
          },
        },
      },
    },
    '/api/data': {
      get: {
        summary: 'Retrieve pantry documents (or trigger Data Eater if hunger is 100%)',
        description:
          'Under normal conditions, returns paginated documents. If hunger has reached 100%, the starving pet devours and permanently destroys a random document.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Returns data resources, OR returns Data Eater cannibalization notice if starving.',
          },
          '403': {
            description: 'Access denied: Pet is angry.',
          },
        },
      },
      post: {
        summary: 'Store a document in the pantry',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', minLength: 1, maxLength: 200 },
                  content: { type: 'string', minLength: 1 },
                  category: {
                    type: 'string',
                    enum: [
                      'Confidential Business Document',
                      'User Note',
                      'Vital Database Record',
                      'Unsaved Thoughts',
                    ],
                    default: 'Confidential Business Document',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Document stored in pantry.',
          },
          '400': {
            description: 'Validation failed.',
          },
          '403': {
            description: 'Access denied: Pet is angry.',
          },
        },
      },
    },
    '/api/data/{id}': {
      delete: {
        summary: 'Delete a pantry document',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: '24-character hexadecimal MongoDB ObjectId',
            schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          },
        ],
        responses: {
          '200': {
            description: 'Document deleted successfully.',
          },
          '400': {
            description: 'Invalid ObjectId format.',
          },
          '404': {
            description: 'Document not found.',
          },
          '403': {
            description: 'Access denied: Pet is angry.',
          },
        },
      },
    },
  },
};

/**
 * Generates modern interactive Scalar API docs HTML referencing /docs.json.
 */
export const renderDocsHtml = () => `<!doctype html>
<html>
  <head>
    <title>The Needy API (DB-Gotchi) - Interactive API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👾</text></svg>">
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/docs.json"
      data-configuration='{"theme":"purple","layout":"modern"}'
      src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"
    ></script>
  </body>
</html>`;
