from pathlib import Path
import time

import requests

URLS = [
    "https://web.archive.org/web/20200920100644/https://ire.org/conferences/nicar2015/schedule/",
    "https://web.archive.org/web/20200814113403/https://www.ire.org/conferences/nicar2016/schedule/",
    "https://web.archive.org/web/20170809002622/http://ire.org/conferences/nicar2017/schedule/",
    "https://web.archive.org/web/20190616145205/https://ire.org/conferences/nicar18/schedule/",
    "https://web.archive.org/web/20200923200706/https://www.ire.org/events-and-training/conferences/nicar-2019/schedule#",
    'https://schedules.ire.org/nicar-2020/nicar-2020-schedule.json',
    "https://schedules.ire.org/nicar-2022/nicar-2022-schedule.csv",
    'https://schedules.ire.org/nicar-2023/nicar-2023-schedule.json',
    'https://schedules.ire.org/nicar-2024/nicar-2024-schedule.json',
    'https://schedules.ire.org/nicar-2025/nicar-2025-schedule.json',
    'https://schedules.ire.org/nicar-2026/nicar-2026-schedule.json'
]

SCHEDULE_DIR = Path("../schedules")

# let's be nice to Wayback Machine
SLEEPY_SECONDS = 5

if __name__ == "__main__":

    SCHEDULE_DIR.mkdir(exist_ok = True)

    for url in URLS:

        print(url)
        r = requests.get(url)
        filename = url.replace("nicar18", "nicar2018").replace("/schedule", "-schedule").strip("/#").split("/")[-1]
        if "." not in filename:
            filename += ".html"
        print(filename)
        with open(SCHEDULE_DIR / filename, "wb") as f:
            f.write(r.content)

        time.sleep(SLEEPY_SECONDS)
