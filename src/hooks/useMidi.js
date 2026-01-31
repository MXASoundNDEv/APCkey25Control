import { useCallback, useEffect, useRef, useState } from 'react';

export function useMidi(onMessage) {
  const [supported] = useState(typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess);
  const [error, setError] = useState(null);
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [selectedInputId, setSelectedInputId] = useState(null);
  const [selectedOutputId, setSelectedOutputId] = useState(null);
  const accessRef = useRef(null);
  const outputRef = useRef(null);

  const refreshPorts = useCallback(() => {
    const access = accessRef.current;
    if (!access) return;

    const nextInputs = Array.from(access.inputs.values()).map(({ id, name }) => ({ id, name }));
    const nextOutputs = Array.from(access.outputs.values()).map(({ id, name }) => ({ id, name }));

    setInputs(nextInputs);
    setOutputs(nextOutputs);

    if (!selectedInputId && nextInputs[0]) {
      setSelectedInputId(nextInputs[0].id);
    }
    if (!selectedOutputId && nextOutputs[0]) {
      setSelectedOutputId(nextOutputs[0].id);
    }
  }, [selectedInputId, selectedOutputId]);

  useEffect(() => {
    if (!supported) {
      setError("L'API Web MIDI n'est pas disponible sur ce poste.");
      return;
    }

    navigator.requestMIDIAccess({ sysex: false })
      .then((access) => {
        accessRef.current = access;
        refreshPorts();
        access.onstatechange = refreshPorts;
      })
      .catch((err) => setError(err?.message || 'Échec de l’accès MIDI'));
  }, [supported, refreshPorts]);

  useEffect(() => {
    const access = accessRef.current;
    if (!access) return undefined;

    const input = selectedInputId ? access.inputs.get(selectedInputId) : null;
    const output = selectedOutputId ? access.outputs.get(selectedOutputId) : null;

    if (input) {
      input.onmidimessage = (message) => {
        if (onMessage) onMessage(message);
      };
    }

    outputRef.current = output;

    return () => {
      if (input) input.onmidimessage = null;
    };
  }, [selectedInputId, selectedOutputId, onMessage]);

  const sendMessage = useCallback((bytes) => {
    const target = outputRef.current;
    if (!target || typeof target.send !== 'function') return;
    try {
      target.send(bytes);
    } catch (err) {
      console.error("Impossible d'envoyer le message MIDI", err);
    }
  }, []);

  return {
    midiSupported: supported,
    error,
    inputs,
    outputs,
    selectedInputId,
    selectedOutputId,
    setSelectedInputId,
    setSelectedOutputId,
    sendMessage
  };
}
