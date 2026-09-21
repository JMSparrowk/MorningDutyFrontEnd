// Phase 2 only: fixed API-shaped fixtures. Reference month: September 2026.
// October assignments are synthetic navigation fixtures. No runtime date generation.
// September 22 is a holiday per backend rules, despite the reference image.
export const calendarMocks = [
  {
    "year": 2026,
    "month": 9,
    "currentUser": {
      "userId": "USER#001",
      "name": "ジョン",
      "emailNotification": false
    },
    "navigation": {
      "previousMonthAvailable": false,
      "nextMonthAvailable": true
    },
    "days": [
      {
        "date": "2026-09-01",
        "dayOfWeek": "TUE",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-09-02",
        "dayOfWeek": "WED",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-09-03",
        "dayOfWeek": "THU",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-09-04",
        "dayOfWeek": "FRI",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      },
      {
        "date": "2026-09-05",
        "dayOfWeek": "SAT",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-09-06",
        "dayOfWeek": "SUN",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-09-07",
        "dayOfWeek": "MON",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-09-08",
        "dayOfWeek": "TUE",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-09-09",
        "dayOfWeek": "WED",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-09-10",
        "dayOfWeek": "THU",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      },
      {
        "date": "2026-09-11",
        "dayOfWeek": "FRI",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-09-12",
        "dayOfWeek": "SAT",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-09-13",
        "dayOfWeek": "SUN",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-09-14",
        "dayOfWeek": "MON",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-09-15",
        "dayOfWeek": "TUE",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-09-16",
        "dayOfWeek": "WED",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-09-17",
        "dayOfWeek": "THU",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-09-18",
        "dayOfWeek": "FRI",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      },
      {
        "date": "2026-09-19",
        "dayOfWeek": "SAT",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-09-20",
        "dayOfWeek": "SUN",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-09-21",
        "dayOfWeek": "MON",
        "holiday": true,
        "holidayName": "敬老の日",
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-09-22",
        "dayOfWeek": "TUE",
        "holiday": true,
        "holidayName": "国民の休日",
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-09-23",
        "dayOfWeek": "WED",
        "holiday": true,
        "holidayName": "秋分の日",
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-09-24",
        "dayOfWeek": "THU",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      },
      {
        "date": "2026-09-25",
        "dayOfWeek": "FRI",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-09-26",
        "dayOfWeek": "SAT",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-09-27",
        "dayOfWeek": "SUN",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-09-28",
        "dayOfWeek": "MON",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-09-29",
        "dayOfWeek": "TUE",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-09-30",
        "dayOfWeek": "WED",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      }
    ],
    "changeCandidates": [
      {
        "date": "2026-09-25",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-09-28",
        "dayOfWeek": "MON",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-09-29",
        "dayOfWeek": "TUE",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-01",
        "dayOfWeek": "THU",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-02",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-05",
        "dayOfWeek": "MON",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-08",
        "dayOfWeek": "THU",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-10-09",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-13",
        "dayOfWeek": "TUE",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-14",
        "dayOfWeek": "WED",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-16",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-10-20",
        "dayOfWeek": "TUE",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-10-21",
        "dayOfWeek": "WED",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-22",
        "dayOfWeek": "THU",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-26",
        "dayOfWeek": "MON",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-28",
        "dayOfWeek": "WED",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-10-29",
        "dayOfWeek": "THU",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-30",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-06",
        "dayOfWeek": "TUE",
        "assignedUserId": null,
        "assignedUserName": "旧ユーザー"
      }
    ]
  },
  {
    "year": 2026,
    "month": 10,
    "currentUser": {
      "userId": "USER#001",
      "name": "ジョン",
      "emailNotification": false
    },
    "navigation": {
      "previousMonthAvailable": true,
      "nextMonthAvailable": false
    },
    "days": [
      {
        "date": "2026-10-01",
        "dayOfWeek": "THU",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-10-02",
        "dayOfWeek": "FRI",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-10-03",
        "dayOfWeek": "SAT",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-10-04",
        "dayOfWeek": "SUN",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-10-05",
        "dayOfWeek": "MON",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-10-06",
        "dayOfWeek": "TUE",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": "旧ユーザー",
        "mine": false
      },
      {
        "date": "2026-10-07",
        "dayOfWeek": "WED",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      },
      {
        "date": "2026-10-08",
        "dayOfWeek": "THU",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-10-09",
        "dayOfWeek": "FRI",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-10-10",
        "dayOfWeek": "SAT",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-10-11",
        "dayOfWeek": "SUN",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-10-12",
        "dayOfWeek": "MON",
        "holiday": true,
        "holidayName": "スポーツの日",
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-10-13",
        "dayOfWeek": "TUE",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-10-14",
        "dayOfWeek": "WED",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-10-15",
        "dayOfWeek": "THU",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      },
      {
        "date": "2026-10-16",
        "dayOfWeek": "FRI",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-10-17",
        "dayOfWeek": "SAT",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-10-18",
        "dayOfWeek": "SUN",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-10-19",
        "dayOfWeek": "MON",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      },
      {
        "date": "2026-10-20",
        "dayOfWeek": "TUE",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-10-21",
        "dayOfWeek": "WED",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-10-22",
        "dayOfWeek": "THU",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-10-23",
        "dayOfWeek": "FRI",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      },
      {
        "date": "2026-10-24",
        "dayOfWeek": "SAT",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-10-25",
        "dayOfWeek": "SUN",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      },
      {
        "date": "2026-10-26",
        "dayOfWeek": "MON",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-10-27",
        "dayOfWeek": "TUE",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#001",
        "assignedUserName": "ジョン",
        "mine": true
      },
      {
        "date": "2026-10-28",
        "dayOfWeek": "WED",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#003",
        "assignedUserName": "松田",
        "mine": false
      },
      {
        "date": "2026-10-29",
        "dayOfWeek": "THU",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#002",
        "assignedUserName": "内海",
        "mine": false
      },
      {
        "date": "2026-10-30",
        "dayOfWeek": "FRI",
        "holiday": false,
        "holidayName": null,
        "hasSchedule": true,
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利",
        "mine": false
      },
      {
        "date": "2026-10-31",
        "dayOfWeek": "SAT",
        "holiday": true,
        "holidayName": null,
        "hasSchedule": false,
        "assignedUserId": null,
        "assignedUserName": null,
        "mine": false
      }
    ],
    "changeCandidates": [
      {
        "date": "2026-09-25",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-09-28",
        "dayOfWeek": "MON",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-09-29",
        "dayOfWeek": "TUE",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-01",
        "dayOfWeek": "THU",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-02",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-05",
        "dayOfWeek": "MON",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-08",
        "dayOfWeek": "THU",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-10-09",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-13",
        "dayOfWeek": "TUE",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-14",
        "dayOfWeek": "WED",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-16",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-10-20",
        "dayOfWeek": "TUE",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-10-21",
        "dayOfWeek": "WED",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-22",
        "dayOfWeek": "THU",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-26",
        "dayOfWeek": "MON",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-28",
        "dayOfWeek": "WED",
        "assignedUserId": "USER#003",
        "assignedUserName": "松田"
      },
      {
        "date": "2026-10-29",
        "dayOfWeek": "THU",
        "assignedUserId": "USER#002",
        "assignedUserName": "内海"
      },
      {
        "date": "2026-10-30",
        "dayOfWeek": "FRI",
        "assignedUserId": "USER#004",
        "assignedUserName": "浅利"
      },
      {
        "date": "2026-10-06",
        "dayOfWeek": "TUE",
        "assignedUserId": null,
        "assignedUserName": "旧ユーザー"
      }
    ]
  }
];

// Preview selections only; production initial selection remains TODO.
export const mockSelectedDates = ['2026-09-18', '2026-10-01'];
