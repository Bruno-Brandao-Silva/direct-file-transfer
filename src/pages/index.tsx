import { FC, useState } from 'react';
import styles from '@/styles/Index.module.css';
import Image from 'next/image';
import { useSocketIO } from '@/context/SocketIOContext';
import { io } from 'socket.io-client';
import { CustomSocketClient } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Home: FC = () => {
  const [name, setName] = useState('');
  const {socket, setSocket } = useSocketIO();
  const router = useRouter();
  const createRoomHanlder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const _name = name.trim();
    if (_name.length > 0) {
      console.log('create room', _name);
      const _socket = io(window.location.origin, { transports: ['websocket'] }) as CustomSocketClient;
      _socket.on('create-room-anwser', (roomId: string) => {
        console.log('room created', roomId);
        _socket.username = _name;
        _socket.roomId = roomId;
        setSocket(_socket);
        console.log(_socket);
        router.push('/room');
      });
      _socket.emit('create-room', _name);
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
          <p>Create your own room to share your files</p>
          <input type="text" required placeholder="Your username" value={name} onChange={e => setName(e.target.value)} />
          <button type="submit" >Create</button>
          <Link href="/invite">I already have a room code</Link>
        </form>
      </section>
    </main>
  );
}

export default Home;
