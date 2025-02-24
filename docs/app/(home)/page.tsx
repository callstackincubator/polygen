'use client';
// import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// export const metadata = {
//   title: 'Polygen',
// };

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/docs/polygen');
  }, [router]);
  return null;
  //
  // return (
  //   <main
  //     style={{
  //       flex: 1,
  //       display: 'flex',
  //       flexDirection: 'column',
  //       textAlign: 'center',
  //       justifyContent: 'center',
  //     }}
  //   >
  //     <h1
  //       style={{
  //         fontSize: '2rem',
  //         fontWeight: 'bold',
  //         marginBottom: '1rem',
  //       }}
  //     >
  //       Hello World
  //     </h1>
  //     <p>
  //       You can open{' '}
  //       <Link
  //         href="/docs"
  //         style={{
  //           fontWeight: '600',
  //           textDecoration: 'underline',
  //         }}
  //       >
  //         /docs
  //       </Link>{' '}
  //       and see the documentation.
  //     </p>
  //   </main>
  // );
}
