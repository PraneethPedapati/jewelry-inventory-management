import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { config } from '../config/app.js';

let sdk: NodeSDK | null = null;

export const initializeTracing = (): void => {
  // Only initialize tracing if enabled
  if (!config.ENABLE_TRACING) {
    console.log('🔧 OpenTelemetry tracing disabled');
    return;
  }

  try {
    const jaegerExporter = new JaegerExporter({
      endpoint: config.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    });

    sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'jewelry-inventory-api',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.NODE_ENV,
      }),
      traceExporter: jaegerExporter,
      instrumentations: [getNodeAutoInstrumentations({
        // Disable some instrumentations if needed
        '@opentelemetry/instrumentation-dns': {
          enabled: false,
        },
        '@opentelemetry/instrumentation-net': {
          enabled: false,
        },
      })],
    });

    sdk.start();
    console.log('✅ OpenTelemetry tracing initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize OpenTelemetry:', error);
  }
};

export const shutdownTracing = async (): Promise<void> => {
  if (sdk) {
    try {
      await sdk.shutdown();
      console.log('📝 OpenTelemetry tracing shut down');
    } catch (error) {
      console.error('Error shutting down tracing:', error);
    }
  }
};

// Custom tracing utilities
const tracer = trace.getTracer('jewelry-inventory', '1.0.0');

export const createSpan = async <T>(
  name: string,
  fn: (span: Span) => Promise<T>
): Promise<T> => {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
};

// Synchronous span helper
export const createSyncSpan = <T>(
  name: string,
  fn: (span: Span) => T
): T => {
  return tracer.startActiveSpan(name, (span) => {
    try {
      const result = fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
};

// Add attributes to current span
export const addSpanAttributes = (attributes: Record<string, string | number | boolean>): void => {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
};

// Add span event
export const addSpanEvent = (name: string, attributes?: Record<string, string | number | boolean>): void => {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
};

// Span decorators for common operations
export const traceDbOperation = async <T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> => {
  return createSpan(`db.${operation}`, async (span) => {
    span.setAttributes({
      'db.operation': operation,
      'db.table': table,
      'db.system': 'postgresql',
    });
    return fn();
  });
};

export const traceApiCall = async <T>(
  method: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> => {
  return createSpan(`http.${method.toLowerCase()}`, async (span) => {
    span.setAttributes({
      'http.method': method,
      'http.route': endpoint,
      'component': 'api',
    });
    return fn();
  });
};

export const traceBusinessLogic = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  return createSpan(`business.${operation}`, async (span) => {
    span.setAttributes({
      'component': 'business-logic',
      'operation': operation,
    });
    return fn();
  });
};

// Trace WhatsApp operations specifically for jewelry store
export const traceWhatsAppOperation = async <T>(
  operation: 'generate_order_message' | 'generate_status_message' | 'send_message',
  orderId?: string,
  fn?: () => Promise<T>
): Promise<T | void> => {
  return createSpan(`whatsapp.${operation}`, async (span) => {
    span.setAttributes({
      'component': 'whatsapp-integration',
      'whatsapp.operation': operation,
      ...(orderId && { 'order.id': orderId }),
    });

    if (fn) {
      return fn();
    }
  });
};

// Handle process shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await shutdownTracing();
  });

  process.on('SIGTERM', async () => {
    await shutdownTracing();
  });
} 
