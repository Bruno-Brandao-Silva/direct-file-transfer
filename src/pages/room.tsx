import { useEffect, useState } from 'react';
import FileInput from '@/components/FileInput';
import { useSocketIO } from '@/context/SocketIOContext';

export default function Home() {
  const { socket } = useSocketIO();

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
  const [sentFiles, setSentFiles] = useState(0);
  const [files, setFiles] = useState<FileList>();
  console.log(socket);
  useEffect(() => {
    const _peerConnection = new RTCPeerConnection();
    setPeerConnection(_peerConnection);
  }, []);
  useEffect(() => {
    if (!socket) return;
    if (!peerConnection) return;

    console.log("setting up socket listeners and peer connection listeners");

    socket.on('connect', () => {
      console.log('connected');
    });
    socket.on('disconnect', () => {
      console.log('disconnected');
    });
    socket.on('offer', async (offer, username) => {
      if (username === socket.username) return;
      console.log('offer', offer, username);
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      console.log('answer', answer);
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', answer);
    });
    socket.on('answer', async (answer, username) => {
      if (username === socket.username) return;
      console.log('answer', answer, username);
      await peerConnection.setRemoteDescription(answer);
    });
    socket.on('iceCandidate', async (iceCandidate, username) => {
      if (username === socket.username) return;
      console.log('iceCandidate', iceCandidate, username);
      await peerConnection.addIceCandidate(iceCandidate);
    });
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', event.candidate);
      }
    };
    peerConnection.ondatachannel = (event) => {
      console.log('ondatachannel');
      const dataChannel = event.channel;
      let receiveBuffer = [];
      let receivedSize = 0;
      let fileName = '';
      let fileSize = 0;
      dataChannel.binaryType = 'arraybuffer';
      dataChannel.onmessage = (event) => {
        console.log('data channel message', event.data);
        switch (typeof event.data) {
          case 'string':
            const metadata = JSON.parse(event.data);
            fileName = metadata.fileName;
            fileSize = metadata.fileSize;
            break;
          case 'object':
            receiveBuffer.push(event.data);
            receivedSize += event.data.byteLength;
            if (receivedSize === fileSize) {
              const received = new Blob(receiveBuffer);
              // download received file
              const link = document.createElement('a');
              link.href = URL.createObjectURL(received);
              link.download = fileName;
              link.click();
              receiveBuffer = [];
              receivedSize = 0;
            }
            break;
        }
      };
      dataChannel.onopen = () => {
        console.log('data channel open');
      };
      dataChannel.onclose = () => {
        console.log('data channel close');
      };
      dataChannel.onerror = (error) => {
        console.log('data channel error', error);
      };
    };
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [peerConnection, socket]);

  const handleSubmit = async () => {
    // Handle file submission logic here
    console.log(peerConnection);
    if (!peerConnection) return;
    const dataChannel = peerConnection.createDataChannel('fileTransfer');
    dataChannel.binaryType = 'arraybuffer';
    dataChannel.onopen = async () => {
      console.log('data channel open');
      if (files) {
        for (let i = 0; i < files.length; i++) {
          console.log(files[i]);
          dataChannel.send(JSON.stringify({ fileName: files[i].name, fileSize: files[i].size }));
          await new Promise<void>((resolve, reject) => {
            const chunkSize = 16384 / 2;
            const fileReader = new FileReader();
            let offset = 0;

            fileReader.addEventListener('error', error => { console.error('Error reading file:', error); reject() });
            fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
            fileReader.addEventListener('load', e => {
              const result = e.target.result as ArrayBuffer;
              dataChannel.send(result);
              offset += result.byteLength;
              progressHandler(offset, i);
              if (offset < files[i].size) {
                readSlice(offset);
              } else {
                setSentFiles(sentFiles + 1);
                resolve();
              }
            });
            const readSlice = (o: number) => {
              console.log('readSlice ', o);
              const slice = files[i].slice(offset, o + chunkSize);
              fileReader.readAsArrayBuffer(slice);
            };
            readSlice(0);
          });
        }
      }
    };
    dataChannel.onclose = () => {
      console.log('data channel close');
    };
    dataChannel.onerror = (error) => {
      console.log('data channel error', error);
    };
    console.log('creating offer');
    peerConnection.createOffer().then(async (offer) => {
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', offer);
    });
  };
  const fileSizeHandler = (fileSize: number) => {
    if (fileSize < 1024) return fileSize + ' bytes';
    else if (fileSize < 1024 * 1024) return (fileSize / 1024).toFixed(2) + ' KB';
    else if (fileSize < 1024 * 1024 * 1024) return (fileSize / 1024 / 1024).toFixed(2) + ' MB';
    else return (fileSize / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }
  const progressHandler = (progress: number, index: number) => {
    const progressBar = document.getElementById(`progress#${index}`) as HTMLProgressElement;
    progressBar.value = progress;
  };
  return (
    <div>
      <h1>Direct File Transfer</h1>
      {/* <ul>
        {connectedUsers.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul> */}

      <div>
        <input type="file" multiple onChange={e => setFiles(e.target.files)} />
        <button type="button" onClick={handleSubmit}>Send Files</button>
        <p>Files:  {sentFiles}/{files?.length || 0}</p>
        {files && (
          <table>
            <tbody>
              {Array.from(files).map((file, index) => (
                <tr key={index}>
                  <td>{file.name}</td>
                  <td>{fileSizeHandler(file.size)}</td>
                  <td><progress id={`progress#${index}`} max={file.size} value={0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <FileInput onChange={e => {

          function concatenateFileLists(fileList1: FileList, fileList2: FileList) {
            const combinedFiles = Array.from(fileList1).concat(Array.from(fileList2));

            const combinedFileList = new DataTransfer();

            combinedFiles.forEach(file => {
              combinedFileList.items.add(file);
            });

            return combinedFileList.files;
          }

          if (files) {
            if (e) {
              setFiles(concatenateFileLists(files, e));
            }
          } else {
            setFiles(e);
          }
        }} />
        {socket?.roomId && <a href={`${window.location.origin}/invite?code=${socket.roomId}`} target='_blank'>{`${window.location.origin}/invite?code=${socket.roomId}`}</a>}
      </div>
    </div>
  );
}
