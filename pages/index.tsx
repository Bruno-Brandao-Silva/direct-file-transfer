import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export default function Home() {
  const connectedUsers = ['User1', 'User2', 'User3'];
  const [socket, setSocket] = useState<Socket>();
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
  const [files, setFiles] = useState<FileList>();
  const [metadata, setMetadata] = useState<{ fileName: string, fileSize: number }>();
  useEffect(() => {
    const _socket = io('http://localhost:3000');
    setSocket(_socket);
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
    socket.on('offer', async (offer) => {
      console.log('offer', offer);
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', answer);
    });
    socket.on('answer', async (answer) => {
      console.log('answer', answer);
      await peerConnection.setRemoteDescription(answer);
    });
    socket.on('iceCandidate', async (iceCandidate) => {
      console.log('iceCandidate', iceCandidate);
      await peerConnection.addIceCandidate(iceCandidate);
    });
    socket.on('file', async (fileName, fileSize) => {
      console.log('file', fileName, fileSize);
      setMetadata({ fileName, fileSize });
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
              setMetadata(null);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
            const chunkSize = 16384 /2;
            const fileReader = new FileReader();
            let offset = 0;

            fileReader.addEventListener('error', error => { console.error('Error reading file:', error); reject() });
            fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
            fileReader.addEventListener('load', e => {
              const result = e.target.result as ArrayBuffer;
              dataChannel.send(result);
              offset += result.byteLength;
              if (offset < files[i].size) {
                readSlice(offset);
              } else {
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

  return (
    <div>
      <h1>Connected Users</h1>
      <ul>
        {connectedUsers.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <input type="file" multiple onChange={e => setFiles(e.target.files)} />
        <button type="submit">Send Files</button>
      </form>
    </div>
  );
}
