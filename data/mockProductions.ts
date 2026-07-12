import type { Project } from "@/types/production";

export const mockProjects: Project[] = [
  {
    id: "default-project",
    title: "Default Project",
    projectCode: "DEFAULT_01",
    description: "Auto-generated default project",
    thumbnailUrl: "",
    status: "Active",
    environments: [
      {
        id: "roger",
        projectId: "default-project",
        name: "Roger_et_ses_humains",
        description: "Season 1 production environment",
        thumbnailUrl: "",
        status: "Active",
        episodes: [
          {
            id: "rsh-109",
            episodeName: "RSH_109",
            previewImage: "/previews/rsh-109.jpg",
            description: "Production tracking for episode RSH_109",
            code: "TBA_JOB00083",
            startDate: "08/10/2020",
            endDate: "10/09/2020",
            status: "Active",

            scenes: [
              {
                id: "109-001",
                sceneName: "109_001",
                previewImage: "/previews/109-001.jpg",
                description: "Opening scene",
                note: "",
                status: "Active",
                workflow: "Basic",
                numberOfFrames: 24,
                priority: 4,
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
                status: "Active",
                workflow: "Single Approval",
                numberOfFrames: 12,
                priority: 3,
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
            status: "Active",
            scenes: [],
          },
        ],
      },
    ],
  },
  {
    id: "hand-to-hand",
    title: "Hand To Hand",
    projectCode: "HTH_01",
    description: "Feature film, live action and animation hybrid",
    thumbnailUrl: "",
    status: "Active",
    environments: []
  },
  {
    id: "the-doll",
    title: "The Doll",
    projectCode: "TD_01",
    description: "Short-form 2D animation production",
    thumbnailUrl: "",
    status: "Active",
    environments: [
      {
        id: "td-001",
        projectId: "the-doll",
        name: "TD_001_Env",
        description: "Production tracking for episode TD_001",
        thumbnailUrl: "",
        status: "Active",
        episodes: [
          {
            id: "td-001-ep",
            episodeName: "TD_001",
            previewImage: "/previews/td-001.jpg",
            description: "Production tracking for episode TD_001",
            code: "TBA_JOB00091",
            startDate: "11/01/2020",
            endDate: "11/20/2020",
            status: "Active",
            scenes: [],
          }
        ]
      }
    ]
  }
];
