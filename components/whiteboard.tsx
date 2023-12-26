"use client";
import React, { useRef, useEffect, useState, MouseEvent } from "react";

interface WhiteboardProps {
  width: number;
  height: number;
}

// Rectangle properties
let startX: number = 0;
let startY: number = 0;
let widthRect: number = 0;
let heightRect: number = 0;
let maxWidth: number = 0;
let maxHeight: number = 0;

const Whiteboard: React.FC<WhiteboardProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  //recording logic
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        contextRef.current = context;
        context.lineCap = "round";
        context.strokeStyle = "white";
        context.lineWidth = 2;
      }
    }
  }, []);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (canvas && contextRef.current) {
      const stream = canvas.captureStream();
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        setRecordedChunks(chunks);
      };

      mediaRecorderRef.current.start();
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      a.href = url;
      a.download = "whiteboard_recording.webm";
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const startDrawing = (e: MouseEvent) => {
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      setIsDrawing(true);
    }
  };

  const draw = (e: MouseEvent) => {
    if (isDrawing && contextRef.current) {
      contextRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      contextRef.current.stroke();
    }
  };

  const startDrawingRectangle = (e: MouseEvent) => {
    if (contextRef.current) {
      contextRef.current.beginPath();
      startX = e.nativeEvent.offsetX;
      startY = e.nativeEvent.offsetY;

      widthRect = 0;
      heightRect = 0;

      console.log(startX);
      console.log(startY);

      // contextRef.current.beginPath();
      //contextRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);

      setIsDrawing(true);
    }
  };

  const drawRectangle = (e: MouseEvent) => {
    if (isDrawing && contextRef.current) {
      var currentX = e.nativeEvent.offsetX;
      var currentY = e.nativeEvent.offsetY;
      if (currentX < startX && currentY < startY) {
        contextRef.current.clearRect(
          startX + 1,
          startY + 1,
          widthRect - 2,
          heightRect - 2
        );
      } else if (currentX > startX && currentY < startY) {
        contextRef.current.clearRect(
          startX - 1,
          startY + 1,
          widthRect + 2,
          heightRect - 2
        );
      } else if (currentX < startX && currentY > startY) {
        contextRef.current.clearRect(
          startX + 1,
          startY - 1,
          widthRect - 2,
          heightRect + 2
        );
      } else {
        contextRef.current.clearRect(
          startX - 1,
          startY - 1,
          widthRect + 2,
          heightRect + 2
        );
      }

      widthRect = e.nativeEvent.offsetX - startX!;
      heightRect = e.nativeEvent.offsetY - startY!;

      if (width > maxWidth) {
        maxWidth = width;
        console.log("INSIDE FIRST IF");
      }
      if (height > maxHeight) {
        maxHeight = height;
        console.log("INSIDE SECOND IF");
      }

      console.log(maxWidth);
      console.log(maxHeight);

      contextRef.current.fillStyle = "white";

      contextRef.current.strokeRect(startX, startY, widthRect, heightRect);
      // contextRef.current.clearRect(startX, startY, maxWidth, maxHeight);
    }
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    if (contextRef.current) {
      contextRef.current.clearRect(0, 0, width, height);
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: "1px solid #ffffff" }}
        onMouseDown={startDrawingRectangle}
        onMouseMove={drawRectangle}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <button style={{ border: "1px solid #ffffff" }} onClick={clearDrawing}>
        Clear
      </button>
      <button
        style={{ border: "1px solid #ffffff" }}
        onClick={() => setIsRecording(!isRecording)}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <button
        style={{ border: "1px solid #ffffff" }}
        onClick={downloadRecording}
        disabled={recordedChunks.length === 0}
      >
        Download Recording
      </button>
    </div>
  );
};

export default Whiteboard;
