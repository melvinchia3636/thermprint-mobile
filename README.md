<center>
  <h1 align="center">🖨️ ThermPrint Mobile</h1>
  <p align="center">A modern, feature-packed mobile companion for Bluetooth Low Energy (BLE) thermal printers</p>
</center>

## 🤔 The Problem

I created a web version of the thermal printer companion app [here](https://github.com/melvinchia3636/thermprint), but it is client-server separated and runs on a computer, so you have to start the server every time you use it. Also, my home WiFi is sometimes problematic; an extremely high packet drop rate for unknown reasons makes data transmission between the client and server very slow. It would be great if I could handle all the human-computer interaction as well as the communication between the companion app and the printer in one place, eliminating the requirement for the interim client-server communication.

## 💡 The Solution

**ThermPrint Mobile** is a fast, offline-first mobile application designed for 58mm BLE thermal printers. It connects directly over Bluetooth Low Energy, communicates via custom binary protocol framing, and provides dedicated tools tailored for creative thermal printing:

- **🖼️ Advanced Image Printing**: High-fidelity 16-level grayscale processing with configurable dithering algorithms (Floyd-Steinberg, Atkinson, Bayer), unsharp masking, contrast/gamma adjustment, and multi-column grid splitting with cut guidelines.
- **📲 Direct Share Integration**: Share images directly from Android Gallery, Photos, or web browsers into ThermPrint to immediately load and process them for printing.
- **🏷️ Journal Spine Tags**: Generates clean vertical volume numbers, date spans, and high-density Data Matrix 2D barcodes for physical notebook and binder archiving.
- **📅 Monthly Calendars**: Generates readable mini-calendar planners formatted for standard 384px thermal paper width.
- **📺 YouTube Video Cards**: Generates video cards with titles, grayscaled thumbnails, and scannable QR code links.
- **🔗 QR Code Generator**: Generates crisp, sharp QR codes with adjustable error correction levels and optional centered logo stamping.
- **⚙️ Hardware Fine-Tuning**: Per-mode hardware settings for thermal energy, print speed, chunk row limits, and stream delays.

## 🖥 Screenshots

<div align="center">
  <img width="49%" alt="ThermPrint Icon" src="./assets/icon.png" />
  <img width="49%" alt="ThermPrint Splash" src="./assets/splash-icon.png" />
</div>

## 🔬 Technologies Used

![TypeScript](https://img.shields.io/badge/-TYPESCRIPT-FF0000?style=for-the-badge&logo=typescript&logoColor=white&color=3178C6)
![React Native](https://img.shields.io/badge/-REACT_NATIVE-FF0000?style=for-the-badge&logo=react&logoColor=white&color=61DAFB)
![Expo](https://img.shields.io/badge/-EXPO-FF0000?style=for-the-badge&logo=expo&logoColor=white&color=000020)
![Tailwind CSS](https://img.shields.io/badge/-TAILWIND_CSS-FF0000?style=for-the-badge&logo=tailwindcss&logoColor=white&color=38BDF8)
![Bluetooth](https://img.shields.io/badge/-BLUETOOTH_LE-FF0000?style=for-the-badge&logo=bluetooth&logoColor=white&color=0082FC)

## ⌨️ Setup

If you want to run this project on your local machine:

1. Clone the repository:
   ```bash
   git clone https://github.com/melvinchia3636/thermprint-mobile.git
   cd thermprint-mobile
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run on Android:
   ```bash
   bun run android
   ```

4. Run on iOS:
   ```bash
   bun run ios
   ```

## 📈 Status

This project is actively maintained. If any bugs are found or if you'd like to request a feature, please feel free to file an issue or submit a pull request!

## 💡 Inspirations

Inspired by my obsession with bloat-free, nonsense-free, and ads-free apps, and my previous [web version](https://github.com/melvinchia3636/thermprint) of the companion app. Huge credit to Google Antigravity for the boring porting task.

## 📄 License

Copyright © 2026 Melvin Chia<br/>
Licensed under the [MIT License](LICENSE).
