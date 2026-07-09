import type { ProductionEnvironment } from "@/types/production";

export const mockProductions: ProductionEnvironment[] = [
  {
    id: "roger",
    name: "Roger_et_ses_humains",
    description: "40x2 series, 2D animation, cut-out",

    episodes: [
      {
        id: "rsh-109",
        episodeName: "RSH_109",
        previewImage: "/previews/rsh-109.jpg",
        description: "Production tracking for episode RSH_109",
        code: "TBA_JOB00083",
        startDate: "08/10/2020",
        endDate: "10/09/2020",

        scenes: [
          {
            id: "109-001",
            sceneName: "109_001",
            previewImage: "/previews/109-001.jpg",
            description: "Opening scene",
            note: "",

            tasks: [
              {
                id: "layout",
                name: "Layout",
                progress: 100,
                status: "Approved",
                assignee: "Jade Johan",
              },
              {
                id: "layout-check",
                name: "Layout Check",
                progress: 100,
                status: "Approved",
                assignee: "Frank Banner",
              },
              {
                id: "setup",
                name: "Setup",
                progress: 100,
                status: "Approved",
                assignee: "Frank Banner",
              },
              {
                id: "rough-animation",
                name: "Rough Animation",
                progress: 60,
                status: "To Validate",
                assignee: "Toon Boom Admin",
              },
              {
                id: "cleanup-animation",
                name: "Cleanup Animation",
                progress: 25,
                status: "Pending",
                assignee: "Lea Luthor",
              },
              {
                id: "compositing",
                name: "Compositing",
                progress: 0,
                status: "Standby",
                assignee: "Carina Allen",
              },
              {
                id: "render",
                name: "Render",
                progress: 0,
                status: "Standby",
                assignee: "Sarah Wayne",
              },
            ],
          },

          {
            id: "109-002",
            sceneName: "109_002",
            previewImage: "/previews/109-002.jpg",
            description: "Living-room scene",
            note: "Check character positioning.",

            tasks: [
              {
                id: "layout",
                name: "Layout",
                progress: 100,
                status: "Approved",
                assignee: "Jade Johan",
              },
              {
                id: "setup",
                name: "Setup",
                progress: 100,
                status: "Approved",
                assignee: "Frank Banner",
              },
              {
                id: "rough-animation",
                name: "Rough Animation",
                progress: 100,
                status: "Approved",
                assignee: "Sarah Wayne",
              },
              {
                id: "cleanup-animation",
                name: "Cleanup Animation",
                progress: 100,
                status: "Approved",
                assignee: "Lea Luthor",
              },
            ],
          },
        ],
      },

      {
        id: "rsh-110",
        episodeName: "RSH_110",
        previewImage: "/previews/rsh-110.jpg",
        description: "Production tracking for episode RSH_110",
        code: "TBA_JOB00084",
        startDate: "08/22/2020",
        endDate: "10/21/2020",
        scenes: [],
      },
    ],
  },

  {
    id: "hand-to-hand",
    name: "Hand_to_Hand",
    description: "Feature film, live action and animation hybrid",
    episodes: [],
  },
];