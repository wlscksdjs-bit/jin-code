import ctypes
import sys
import subprocess

if not ctypes.windll.shell32.IsUserAnAdmin():
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, __file__, None, 1)
else:
    # 사용 가능한 배포판 확인
    print("사용 가능한 배포판 목록:")
    subprocess.run(["wsl", "--list", "--online"])

    print("\nUbuntu 설치 중...")
    # Ubuntu 설치 (배포판 이름 지정)
    subprocess.run(["wsl", "--install", "-d", "Ubuntu"])
