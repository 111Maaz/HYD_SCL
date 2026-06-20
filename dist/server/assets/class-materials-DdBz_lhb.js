const CLASS_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const OFFICE_PREVIEW_EXTENSIONS = /* @__PURE__ */ new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx"]);
function getMaterialPreviewUrl(fileUrl, fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (OFFICE_PREVIEW_EXTENSIONS.has(extension)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
  }
  return fileUrl;
}
const MOCK_CLASS_MATERIALS = [
  {
    id: "cm-001",
    class_number: 1,
    title: "English Reader — Term 1",
    subject: "English",
    description: "Phonics practice sheets and short reading passages for the first term.",
    file_url: "/materials/class-1/english-term-1.pdf",
    file_name: "english-term-1.pdf",
    uploaded_by: null,
    created_at: "2026-06-01T08:00:00.000Z",
    updated_at: "2026-06-01T08:00:00.000Z"
  },
  {
    id: "cm-002",
    class_number: 1,
    title: "Mathematics Workbook",
    subject: "Mathematics",
    description: "Number sense exercises covering counting, addition and shapes.",
    file_url: "/materials/class-1/mathematics-workbook.pdf",
    file_name: "mathematics-workbook.pdf",
    uploaded_by: null,
    created_at: "2026-06-01T08:00:00.000Z",
    updated_at: "2026-06-01T08:00:00.000Z"
  },
  {
    id: "cm-003",
    class_number: 5,
    title: "Science Lab Manual",
    subject: "Science",
    description: "Guided experiments for plant biology and basic chemistry units.",
    file_url: "/materials/class-5/science-lab-manual.pdf",
    file_name: "science-lab-manual.pdf",
    uploaded_by: null,
    created_at: "2026-06-02T09:30:00.000Z",
    updated_at: "2026-06-02T09:30:00.000Z"
  },
  {
    id: "cm-004",
    class_number: 5,
    title: "Social Studies Notes",
    subject: "Social Studies",
    description: "Chapter summaries on Indian geography and civic responsibilities.",
    file_url: "/materials/class-5/social-studies-notes.pdf",
    file_name: "social-studies-notes.pdf",
    uploaded_by: null,
    created_at: "2026-06-02T09:30:00.000Z",
    updated_at: "2026-06-02T09:30:00.000Z"
  },
  {
    id: "cm-005",
    class_number: 5,
    title: "Arabic Vocabulary List",
    subject: "Arabic",
    description: "Weekly vocabulary with transliteration for Quranic Arabic foundations.",
    file_url: "/materials/class-5/arabic-vocabulary.pdf",
    file_name: "arabic-vocabulary.pdf",
    uploaded_by: null,
    created_at: "2026-06-02T09:30:00.000Z",
    updated_at: "2026-06-02T09:30:00.000Z"
  },
  {
    id: "cm-006",
    class_number: 9,
    title: "Physics Formula Sheet",
    subject: "Physics",
    description: "Key formulas and unit conversions for motion, force and energy chapters.",
    file_url: "/materials/class-9/physics-formula-sheet.pdf",
    file_name: "physics-formula-sheet.pdf",
    uploaded_by: null,
    created_at: "2026-06-03T10:00:00.000Z",
    updated_at: "2026-06-03T10:00:00.000Z"
  },
  {
    id: "cm-007",
    class_number: 9,
    title: "Chemistry Practical Guide",
    subject: "Chemistry",
    description: "Safety guidelines and observation templates for senior lab sessions.",
    file_url: "/materials/class-9/chemistry-practical-guide.pdf",
    file_name: "chemistry-practical-guide.pdf",
    uploaded_by: null,
    created_at: "2026-06-03T10:00:00.000Z",
    updated_at: "2026-06-03T10:00:00.000Z"
  },
  {
    id: "cm-008",
    class_number: 10,
    title: "Board Exam Sample Papers",
    subject: "General",
    description: "Model question papers with marking schemes for SSC board preparation.",
    file_url: "/materials/class-10/board-sample-papers.pdf",
    file_name: "board-sample-papers.pdf",
    uploaded_by: null,
    created_at: "2026-06-04T11:00:00.000Z",
    updated_at: "2026-06-04T11:00:00.000Z"
  }
];
function getMaterialsByClass(classNumber, materials = MOCK_CLASS_MATERIALS) {
  return materials.filter((m) => m.class_number === classNumber).sort((a, b) => a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title));
}
export {
  CLASS_NUMBERS as C,
  MOCK_CLASS_MATERIALS as M,
  getMaterialsByClass as a,
  getMaterialPreviewUrl as g
};
