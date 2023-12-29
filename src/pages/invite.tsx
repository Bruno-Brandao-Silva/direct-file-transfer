import { FC, useEffect, useState } from 'react';
import styles from '@/styles/Invite.module.css';
import Image from 'next/image';
import { useSocketIO } from '@/context/SocketIOContext';
import { io } from 'socket.io-client';
import { CustomSocketClient } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';

const Invite: FC = () => {
  const [name, setName] = useState('');
  const { setSocket } = useSocketIO();
  const router = useRouter();
  const roomCode = useSearchParams().get('code');
  const [inviteInput, setInviteInput] = useState("");
  useEffect(() => {
    if (!roomCode) return;
    if (roomCode.trim().length === 0) return;
    setInviteInput(roomCode);
  }, [roomCode]);
  const createRoomHanlder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const _name = name.trim();
    if (_name.length > 0) {
      console.log('create room', _name);
      const _socket = io(window.location.origin, { transports: ['websocket'] }) as CustomSocketClient;
      _socket.on('join-room-awnser', (roomId: string) => {
        console.log('joined in room', roomId);
        if (!roomId) {
          alert('Room not found');
          return;
        };
        _socket.username = _name;
        _socket.roomId = roomId;
        setSocket(_socket);
        router.push('/room');
        router
      });
      _socket.emit('join-room', inviteInput, _name);
    } else {
      setName('');
      alert('Please enter a valid name');
    }
  }
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <Image src="https://www.kadencewp.com/wp-content/uploads/2020/10/alogo-2.svg" alt="logo" width={50} height={50} />
        <h1>Direct File Transfer</h1>
        <form onSubmit={createRoomHanlder}>
          <p>Join in a room to share your files</p>
          <input type="number" required placeholder="Room code" value={inviteInput} onChange={e => setInviteInput(e.target.value)} disabled={!!roomCode} />
          <input type="text" required placeholder="Your username" value={name} onChange={e => setName(e.target.value)} />
          <button type="submit" >Join</button>
        </form>
      </section>
    </main>
  );
}

export default Invite;
