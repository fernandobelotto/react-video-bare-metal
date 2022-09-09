import { useEffect, useRef, useState } from "react";

export default function App() {

  const previewRef = useRef<any>()
  const recordRef = useRef<any>()

  const [videodevices, setVideodevices] = useState<any>([])
  const [deviceId, setDeviceId] = useState<any>('')


  // TODO: refactor and understand
  function wait(delayInMS: number) {
    return new Promise(resolve => setTimeout(resolve, delayInMS));
  }

  // TODO: refactor and understand
  function startRecording(stream: any, lengthInMS: any) {
    let recorder = new MediaRecorder(stream);
    let data: any = [];

    recorder.ondataavailable = (event: any) => data.push(event.data);
    recorder.start();

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event: any) => reject(event.name);
    });

    let recorded = wait(lengthInMS).then(
      () => recorder.state == "recording" && recorder.stop()
    );

    return Promise.all([
      stopped,
      recorded
    ])
      .then(() => data);
  }

  function handleStart() {
    const options = {
      video: {
        width: {
          exact: 192 * 2
        },
        height: {
          exact: 108 * 2
        },
        deviceId: {
          exact: deviceId
        }
      }
    }
    navigator.mediaDevices.getUserMedia(options).then(stream => {
      previewRef.current.srcObject = stream;
      previewRef.current.captureStream = previewRef.current.captureStream || previewRef.current.mozCaptureStream;
      return new Promise(resolve => previewRef.current.onplaying = resolve);
    })
      .then(() => startRecording(previewRef.current.captureStream(), 1000))
      .then(recordedChunks => {

        const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });

        recordRef.current.src = URL.createObjectURL(recordedBlob);

        console.log(recordedBlob.size + "bytes")
        console.log(recordedBlob.type + "media")

      })
      .catch(console.log);

  }

  function handleStop() {
    const stream = previewRef.current.srcObject
    stream.getTracks().forEach((track: any) => track.stop());

  }


  useEffect(
    () => {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          let videodevices = devices.filter((e) => e.kind === 'videoinput');;

          setVideodevices(videodevices)
        })
        .catch(console.log)
    }
    , [])



  return (
    <>
      <h1>Video Record</h1>

      <button onClick={handleStart}>Record!</button>
      <button onClick={handleStop}>Stop!</button>

      <div>

        <h3>Video Source</h3>
        <p>{deviceId}</p>
        <div>

          <select name="" id="videoSource" onChange={e => setDeviceId(e.target.value)}>
            {videodevices.map((videodevice: any) => {
              return (
                <>
                  <option key={videodevice.deviceId} value={videodevice?.deviceId}>{videodevice?.label}</option>
                </>
              )
            })}
          </select>
        </div>
      </div>

      <hr />
      <h2>Preview</h2>
      <video ref={previewRef} width="100%" height="200px" autoPlay muted></video>
      <hr />
      <h2>Recording</h2>
      <video ref={recordRef} width="100%" height="200px" controls></video>
    </>
  )
}
