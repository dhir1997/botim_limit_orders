import type { ReactNode } from 'react';
import StatusBar from './StatusBar';
import './PhoneShell.css';

/** 390×844 device frame. Screens render in the viewport; sheets & toasts overlay it. */
export default function PhoneShell({ children, bg, dark = false }: { children: ReactNode; bg?: string; dark?: boolean }) {
  return (
    <div className={`phone${dark ? ' phone--dark' : ''}`} style={bg ? { background: bg } : undefined}>
      <div className="phone__notch" />
      <StatusBar />
      <div className="phone__viewport" id="phone-viewport">{children}</div>
      <div className="phone__home" />
    </div>
  );
}
