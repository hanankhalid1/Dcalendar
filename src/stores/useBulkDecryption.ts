import React from 'react';
import { Linking, Platform } from 'react-native';

type EncryptedMessage = string | { encrypted: string; version?: string };

type DecryptState = {
  decryptedMessages: any[] | null;
  count: number | null;
  version: string | null;
  loading: boolean;
  error: string | null;
};

function parseQuery(url: string) {
  const out: Record<string, string> = {};
  const [, query = ''] = url.split('?');
  query.split('&').forEach(pair => {
    const i = pair.indexOf('=');
    if (i > 0) {
      out[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(
        pair.slice(i + 1),
      );
    }
  });
  return out;
}

export function useNcogBulkDecrypt(appId: string, returnScheme: string) {
  const [state, setState] = React.useState<DecryptState>({
    decryptedMessages: null,
    count: null,
    version: null,
    loading: false,
    error: null,
  });
  const lastEncryptedRef = React.useRef<EncryptedMessage[]>([]);
  const requestBulkDecrypt = React.useCallback(
    async (encryptedMessages: EncryptedMessage[]) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
         lastEncryptedRef.current = encryptedMessages;
      console.log('====================================');
      console.log("encypted message",encryptedMessages);
      console.log('====================================');
      try {
        const requestId = `req_${Date.now()}`;
        const returnUrl = `${returnScheme}://ncog-response`;
        console.log('====================================');
        console.log("encrypted message",encryptedMessages);
        console.log('====================================');
        const url =
          `ncog://request?` +
          `appId=${encodeURIComponent(appId)}` +
          `&action=${encodeURIComponent('bulkDecrypt')}` +
          `&requestId=${encodeURIComponent(requestId)}` +
          `&encryptedMessages=${encodeURIComponent(
            JSON.stringify(encryptedMessages),
          )}` +
          `&version=${encodeURIComponent('v1')}` +
          `&returnUrl=${encodeURIComponent(returnUrl)}`;
        console.log('====================================');
        console.log(url);
        console.log('====================================');
        await Linking.openURL(url);
      } catch (err: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err?.message || 'Failed to open Ncog request',
        }));
      }
    },
    [appId, returnScheme],
  );

  
React.useEffect(() => {
  const sub = Linking.addEventListener('url', ({ url }) => {
    if (!url.startsWith(`${returnScheme}://ncog-response`)) return;

    const qs = parseQuery(url);
    console.log("Raw qs", qs);
    console.log("Raw data", qs.data);

    if (qs.success === 'true' && qs.data) {
      try {
        let payload = JSON.parse(qs.data); // first parse

        // if payload is an array of stringified objects, parse again
        if (Array.isArray(payload) && typeof payload[0] === "string") {
          payload = payload.map(item => JSON.parse(item));
        }

        console.log("Payload", payload);

        const decryptedMessages =
          payload.messages || payload || [];

        const withUUID = decryptedMessages.map((msg, i) => ({
            ...msg,
            uuid:
              (lastEncryptedRef.current[i] as any)?.uuid || null,
          }));
        setState({
         decryptedMessages: withUUID,
          count: payload.count ?? decryptedMessages.length,
          version: payload.version ?? null,
          loading: false,
          error: null,
        });

        console.log("Decrypted result:", decryptedMessages);
        
      } catch (err: any) {
        console.log("Parsing error:", err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to parse Ncog response',
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        loading: false,
        error: qs.error || 'Ncog bulk decrypt failed',
      }));
    }
  });

  return () => {
    sub.remove();
  };
}, [returnScheme]);

  return {
    ...state,
    requestBulkDecrypt,
  };
}