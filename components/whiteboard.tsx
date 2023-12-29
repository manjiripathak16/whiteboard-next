"use client";
import React, { useRef, useEffect, useState, MouseEvent } from "react";
import rough from "roughjs";

interface WhiteboardProps {
  width: number;
  height: number;
}

//declare const rough: any; // Declare rough as any directly

let startX: number = 0;
let startY: number = 0;

const Whiteboard: React.FC<WhiteboardProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  //making another canvas layer
  const canvasDrawingRef = useRef<HTMLCanvasElement | null>(null);
  const contextDrawingRef = useRef<CanvasRenderingContext2D | null>(null);
  //recording logic
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  console.log("OUTSIDE" + contextRef.current);
  console.log("OUTSIDE" + contextDrawingRef.current);

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

    //same for layer 2
    const canvas2 = canvasDrawingRef.current;

    if (canvas2) {
      const context2 = canvas2.getContext("2d");
      if (context2) {
        contextDrawingRef.current = context2;
        context2.lineCap = "round";
        context2.strokeStyle = "white";
        context2.lineWidth = 2;
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
    console.log(contextRef.current);
    console.log(contextDrawingRef.current);

    if (contextRef.current) {
      startX = e.nativeEvent.offsetX;
      startY = e.nativeEvent.offsetY;

      console.log("INSIDE START DRAWING");

      //Redraw everything from layer 2 to layer 1
      if (contextRef.current && contextDrawingRef.current) {
        console.log("INSIDE REDRAW OF START DRAWING");
        const imageData = contextDrawingRef.current.getImageData(
          0,
          0,
          width,
          height
        );

        contextRef.current.putImageData(imageData, 0, 0);
      }
      setIsDrawing(true);
    }
  };

  // const drawRectangle = (e: MouseEvent) => {
  //   if (isDrawing && contextRef.current) {
  //     var currentX = e.nativeEvent.offsetX;
  //     var currentY = e.nativeEvent.offsetY;
  //     if (currentX < startX && currentY < startY) {
  //       contextRef.current.clearRect(
  //         startX + 1,
  //         startY + 1,
  //         widthRect - 2,
  //         heightRect - 2
  //       );
  //     } else if (currentX > startX && currentY < startY) {
  //       contextRef.current.clearRect(
  //         startX - 1,
  //         startY + 1,
  //         widthRect + 2,
  //         heightRect - 2
  //       );
  //     } else if (currentX < startX && currentY > startY) {
  //       contextRef.current.clearRect(
  //         startX + 1,
  //         startY - 1,
  //         widthRect - 2,
  //         heightRect + 2
  //       );
  //     } else {
  //       contextRef.current.clearRect(
  //         startX - 1,
  //         startY - 1,
  //         widthRect + 2,
  //         heightRect + 2
  //       );
  //     }

  //     widthRect = e.nativeEvent.offsetX - startX!;
  //     heightRect = e.nativeEvent.offsetY - startY!;

  //     if (width > maxWidth) {
  //       maxWidth = width;
  //       console.log("INSIDE FIRST IF");
  //     }
  //     if (height > maxHeight) {
  //       maxHeight = height;
  //       console.log("INSIDE SECOND IF");
  //     }

  //     contextRef.current.fillStyle = "white";

  //     contextRef.current.strokeRect(startX, startY, widthRect, heightRect);
  //     // contextRef.current.clearRect(startX, startY, maxWidth, maxHeight);
  //   }
  // };

  const drawRectangle = (e: MouseEvent) => {
    if (isDrawing && contextRef.current) {
      const currentX = e.nativeEvent.offsetX;
      const currentY = e.nativeEvent.offsetY;

      console.log("INSIDE  DRAWING");

      //Redraw everything from layer 2 to layer 1
      if (contextRef.current && contextDrawingRef.current) {
        console.log("INSIDE FIRST REDRAW OF DRAWING");
        const imageData = contextDrawingRef.current.getImageData(
          0,
          0,
          width,
          height
        );

        contextRef.current.putImageData(imageData, 0, 0);
      }

      // Clear the canvas
      contextRef.current.clearRect(0, 0, width, height);

      //Redraw everything from layer 2 to layer 1
      if (contextRef.current && contextDrawingRef.current) {
        console.log("INSIDE SECOND REDRAW OF DRAWING");
        const imageData = contextDrawingRef.current.getImageData(
          0,
          0,
          width,
          height
        );

        contextRef.current.putImageData(imageData, 0, 0);
      }

      const roughCanvas = rough.canvas(canvasRef.current!);
      const rectangle = roughCanvas.rectangle(
        startX,
        startY,
        currentX - startX,
        currentY - startY,
        {
          roughness: 2,
          stroke: "white",
        }
      );

      roughCanvas.draw(rectangle);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);

    console.log("INSIDE STOP DRAWING");

    // Redraw everything from layer 1 to layer 2
    if (contextRef.current && contextDrawingRef.current) {
      console.log("INSIDE REDRAW OF STOP DRAWING");
      const imageData = contextRef.current.getImageData(0, 0, width, height);

      contextDrawingRef.current.putImageData(imageData, 0, 0);
    }
  };

  const clearDrawing = () => {
    if (contextRef.current && contextDrawingRef.current) {
      // Clear the canvas
      contextRef.current.clearRect(0, 0, width, height);
      contextDrawingRef.current.clearRect(0, 0, width, height);
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
      <canvas
        ref={canvasDrawingRef}
        width={width}
        height={height}
        style={{ border: "1px solid #ffffff", display: "none" }}
      />
      <button style={{ border: "1px solid #ffffff" }} onClick={clearDrawing}>
        Clear
      </button>
      <button
        style={{ border: "1px solid #ffffff" }}
        onClick={downloadRecording}
        disabled={recordedChunks.length === 0}
      >
        Undo
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
