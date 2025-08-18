'use client';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';



export default function Home() {
  useEffect(() => {
    AOS.init({
      duration: 800, // animation duration
      once: true,    // whether animation should happen only once
    });
  }, []);
  return (
    <>
   
      </>
  );
}
