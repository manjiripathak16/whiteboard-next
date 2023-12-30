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

  //drawing shape state for rectangle/circle buttons
  const [drawingShape, setDrawingShape] = useState<String>("freeform");

  //state for undo logic
  const [prevDrawing, setPrevDrawing] = useState<ImageData[]>([]);

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

  //freeform

  const startDrawing = (e: MouseEvent) => {
    if (contextRef.current && contextDrawingRef.current && prevDrawing) {
      const imageDataForUndo = contextDrawingRef.current.getImageData(
        0,
        0,
        width,
        height
      );

      // Save the starting point for undo purposes
      setPrevDrawing((prevDrawing) => [...prevDrawing, imageDataForUndo]);

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

  //rectangle

  const startDrawingRectangle = (e: MouseEvent) => {
    if (contextRef.current && contextDrawingRef.current && prevDrawing) {
      startX = e.nativeEvent.offsetX;
      startY = e.nativeEvent.offsetY;

      const imageDataForUndo = contextDrawingRef.current.getImageData(
        0,
        0,
        width,
        height
      );

      // Save the starting point for undo purposes
      setPrevDrawing((prevDrawing) => [...prevDrawing, imageDataForUndo]);

      //Redraw everything from layer 2 to layer 1
      if (contextRef.current && contextDrawingRef.current) {
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

  const drawRectangle = (e: MouseEvent) => {
    if (isDrawing && contextRef.current) {
      const currentX = e.nativeEvent.offsetX;
      const currentY = e.nativeEvent.offsetY;

      //Redraw everything from layer 2 to layer 1
      if (contextRef.current && contextDrawingRef.current) {
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

  //circle

  const calculateDistance = (
    startX: any,
    startY: any,
    currentX: any,
    currentY: any
  ) => {
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    return distance;
  };
  const startDrawingCircle = (e: MouseEvent) => {
    if (contextRef.current && contextDrawingRef.current && prevDrawing) {
      startX = e.nativeEvent.offsetX;
      startY = e.nativeEvent.offsetY;

      const imageDataForUndo = contextDrawingRef.current.getImageData(
        0,
        0,
        width,
        height
      );

      // Save the starting point for undo purposes
      setPrevDrawing((prevDrawing) => [...prevDrawing, imageDataForUndo]);

      //Redraw everything from layer 2 to layer 1
      if (contextRef.current && contextDrawingRef.current) {
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

  const drawCircle = (e: MouseEvent) => {
    if (isDrawing && contextRef.current && contextDrawingRef.current) {
      const currentX = e.nativeEvent.offsetX;
      const currentY = e.nativeEvent.offsetY;

      //Redraw everything from layer 2 to layer 1
      if (contextRef.current && contextDrawingRef.current) {
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
        const imageData = contextDrawingRef.current.getImageData(
          0,
          0,
          width,
          height
        );

        contextRef.current.putImageData(imageData, 0, 0);
      }

      const roughCanvas = rough.canvas(canvasRef.current!);
      const diameter = calculateDistance(startX, startY, currentX, currentY);

      const circle = roughCanvas.circle(startX, startY, diameter, {
        roughness: 2,
        stroke: "white",
      });

      roughCanvas.draw(circle);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);

    // Redraw everything from layer 1 to layer 2
    if (contextRef.current && contextDrawingRef.current) {
      const imageData = contextRef.current.getImageData(0, 0, width, height);

      contextDrawingRef.current.putImageData(imageData, 0, 0);
    }
  };

  const clearDrawing = () => {
    if (contextRef.current && contextDrawingRef.current) {
      // Clear the canvas
      contextRef.current.clearRect(0, 0, width, height);
      contextDrawingRef.current.clearRect(0, 0, width, height);
      setPrevDrawing([]);
    }
  };

  //function to change shape
  const changeShape = (shape: String) => {
    setDrawingShape(shape);
  };

  //function for undo
  const undoDrawing = () => {
    if (contextRef.current && prevDrawing) {
      const lastDrawing = prevDrawing[prevDrawing.length - 1];
      contextRef.current.putImageData(lastDrawing, 0, 0);
      setPrevDrawing((prevDrawing) => prevDrawing.slice(0, -1));
    }

    // Redraw everything from layer 1 to layer 2
    if (contextRef.current && contextDrawingRef.current) {
      const imageData = contextRef.current.getImageData(0, 0, width, height);

      contextDrawingRef.current.putImageData(imageData, 0, 0);
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: "1px solid #ffffff" }}
        onMouseDown={
          drawingShape == "rectangle"
            ? startDrawingRectangle
            : drawingShape == "circle"
            ? startDrawingCircle
            : startDrawing
        }
        onMouseMove={
          drawingShape == "rectangle"
            ? drawRectangle
            : drawingShape == "circle"
            ? drawCircle
            : draw
        }
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <canvas
        ref={canvasDrawingRef}
        width={width}
        height={height}
        style={{ border: "1px solid #ffffff", display: "none" }}
      />
      <button
        style={{ border: "1px solid #ffffff", margin: "2px" }}
        onClick={clearDrawing}
      >
        Clear
      </button>
      <button
        style={{ border: "1px solid #ffffff", margin: "2px" }}
        onClick={prevDrawing.length ? undoDrawing : () => {}}
      >
        Undo
      </button>
      <button
        style={{ border: "1px solid #ffffff", margin: "2px" }}
        onClick={() => setIsRecording(!isRecording)}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <button
        style={{ border: "1px solid #ffffff", margin: "2px" }}
        onClick={downloadRecording}
        disabled={recordedChunks.length === 0}
      >
        Download Recording
      </button>
      <button
        style={{ border: "1px solid #ffffff", margin: "2px" }}
        onClick={() => changeShape("freeform")}
      >
        freeform
      </button>
      <button
        style={{ border: "1px solid #ffffff", margin: "2px" }}
        onClick={() => changeShape("rectangle")}
      >
        rectangle
      </button>
      <button
        style={{ border: "1px solid #ffffff", margin: "2px" }}
        onClick={() => changeShape("circle")}
      >
        circle
      </button>
    </div>
  );
};

export default Whiteboard;
