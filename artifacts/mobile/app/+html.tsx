import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* Primary meta */}
        <title>Spontaneous — Let AI Pick Your Next Adventure</title>
        <meta
          name="description"
          content="Stop overthinking dinner and weekend plans. Spontaneous uses AI to instantly pick the perfect restaurant or activity for you — complete with reservation times, what to wear, and a full day itinerary."
        />
        <meta name="theme-color" content="#0F0A1A" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Spontaneous — Let AI Pick Your Next Adventure" />
        <meta
          property="og:description"
          content="Stop overthinking dinner and weekend plans. Spontaneous uses AI to instantly pick the perfect restaurant or activity for you — complete with reservation times, what to wear, and a full day itinerary."
        />
        <meta property="og:site_name" content="Spontaneous" />

        {/* Twitter card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Spontaneous — Let AI Pick Your Next Adventure" />
        <meta
          name="twitter:description"
          content="Stop overthinking dinner and weekend plans. Spontaneous uses AI to instantly pick the perfect restaurant or activity for you."
        />

        {/* Preconnect to shave load time on external origins */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/*
          Resets the body & html styles so Expo Router's ScrollView works
          correctly on the web. Required by Expo Router.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, #root { height: 100%; background-color: #0F0A1A; }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
