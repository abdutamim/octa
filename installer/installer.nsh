# Octa - Custom NSIS Installer Branding
# Included by electron-builder before MUI2.nsh

# Header colors, Octa Code dark violet theme
!define MUI_BGCOLOR "0D0913"
!define MUI_TEXTCOLOR "F5F0FB"
!define MUI_HEADER_TRANSPARENT_TEXT

# Welcome Page
!define MUI_WELCOMEPAGE_TITLE "Welcome to Octa"
!define MUI_WELCOMEPAGE_TEXT "Octa is a Windows control center for voice-first planning, research, and execution in Arabic, English, or mixed language.$\r$\n$\r$\nRuntime data stays in the Octa home folder outside AppData. Add keys and finish the health check after launch.$\r$\n$\r$\nClick Next to continue."

# Finish Page
!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT "Octa has been installed successfully.$\r$\n$\r$\nFinish the first-run setup to connect Gemini, choose the vault, install Python and Playwright, and confirm the health check.$\r$\n$\r$\nClick Finish to launch Octa."

# Abort Warning
!define MUI_ABORTWARNING_TEXT "Are you sure you want to cancel the installation of Octa?"
