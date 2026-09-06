"use client";

import { useEffect, useRef, useState } from "react";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { submitSignOff } from "@/actions/service-requests";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 140;

export function SignOffForm({ serviceRequestId, returnPath }: { serviceRequestId: string; returnPath: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const boundAction = submitSignOff.bind(null, serviceRequestId, returnPath);

  function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  }

  useEffect(() => {
    initCanvas();
  }, []);

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
    canvas.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/jpeg", 0.92));
    setError(null);
  }

  function handleClear() {
    initCanvas();
    setSignatureDataUrl("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!signatureDataUrl) {
      e.preventDefault();
      setError("Please sign in the box before submitting.");
    }
  }

  return (
    <form action={boundAction} onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Signed by" htmlFor="signOffName" required>
          <Input id="signOffName" name="signOffName" required placeholder="Full name" />
        </Field>
        <Field label="Title" htmlFor="signOffTitle" required>
          <Input id="signOffTitle" name="signOffTitle" required placeholder="e.g. IT Infrastructure Manager" />
        </Field>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Signature</p>
          <button type="button" onClick={handleClear} className="text-xs text-slate-500 hover:text-slate-700">
            Clear
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full touch-none rounded-lg border border-slate-300 bg-white"
        />
      </div>
      <input type="hidden" name="signatureDataUrl" value={signatureDataUrl} readOnly />
      <input type="hidden" name="signatureWidth" value={CANVAS_WIDTH} readOnly />
      <input type="hidden" name="signatureHeight" value={CANVAS_HEIGHT} readOnly />
      <Button type="submit" className="w-full">
        Submit sign-off
      </Button>
      <p className="text-xs text-slate-400">
        This creates a signed acceptance certificate attached to this request and available in the Download Center —
        the same document your provider can attach for billing.
      </p>
    </form>
  );
}
