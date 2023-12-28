import { FC, useEffect, useMemo, useState } from 'react';
import styles from '@/styles/Home.module.css';
import Image from 'next/image';
import { useSocketIO } from '@/context/SocketIOContext';
import { io } from 'socket.io-client';
import { CustomSocketClient } from '@/types';

const Home: FC = () => {
  const [name, setName] = useState('');
  const { setSocket } = useSocketIO();

  const createRoomHanlder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const _name = name.trim();
    if (_name.length > 0) {
      console.log('create room', _name);
      const _socket = io(window.location.origin, { transports: ['websocket'] }) as CustomSocketClient;
      _socket.on('room-created', (roomId: string) => {
        console.log('room created', roomId);
        _socket.username = _name;
        _socket.roomId = roomId;
        setSocket(_socket);
        window.location.href = `/room/${roomId}`;
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
        </form>
      </section>
    </main>
  );
}

export default Home;
