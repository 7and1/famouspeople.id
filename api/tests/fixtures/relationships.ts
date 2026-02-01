export const mockRelationshipRows = [
  {
    source_fpid: 'FP-001',
    target_fpid: 'FP-002',
    relation_type: 'colleague',
    start_date: '2020-01-01',
    end_date: null,
    relation_types: { code: 'colleague', label: 'Colleague', reverse_label: 'Colleague of' },
    source: { fpid: 'FP-001', slug: 'elon-musk', full_name: 'Elon Musk', image_url: 'https://example.com/elon.jpg', is_published: true },
    target: { fpid: 'FP-002', slug: 'jeff-bezos', full_name: 'Jeff Bezos', image_url: 'https://example.com/jeff.jpg', is_published: true },
  },
  {
    source_fpid: 'FP-002',
    target_fpid: 'FP-001',
    relation_type: 'competitor',
    start_date: '2015-01-01',
    end_date: null,
    relation_types: { code: 'competitor', label: 'Competitor', reverse_label: 'Competed with' },
    source: { fpid: 'FP-002', slug: 'jeff-bezos', full_name: 'Jeff Bezos', image_url: 'https://example.com/jeff.jpg', is_published: true },
    target: { fpid: 'FP-001', slug: 'elon-musk', full_name: 'Elon Musk', image_url: 'https://example.com/elon.jpg', is_published: true },
  },
  {
    source_fpid: 'FP-001',
    target_fpid: 'FP-003',
    relation_type: 'friend',
    start_date: '2018-05-15',
    end_date: '2020-12-31',
    relation_types: { code: 'friend', label: 'Friend', reverse_label: 'Friend of' },
    source: { fpid: 'FP-001', slug: 'elon-musk', full_name: 'Elon Musk', image_url: 'https://example.com/elon.jpg', is_published: true },
    target: { fpid: 'FP-003', slug: 'albert-einstein', full_name: 'Albert Einstein', image_url: 'https://example.com/einstein.jpg', is_published: true },
  },
];

export const mockRelationTypes = [
  { code: 'colleague', label: 'Colleague', reverse_label: 'Colleague of' },
  { code: 'competitor', label: 'Competitor', reverse_label: 'Competed with' },
  { code: 'friend', label: 'Friend', reverse_label: 'Friend of' },
  { code: 'spouse', label: 'Spouse', reverse_label: 'Spouse of' },
  { code: 'parent', label: 'Parent', reverse_label: 'Child of' },
  { code: 'sibling', label: 'Sibling', reverse_label: 'Sibling of' },
];

export const mockIdentityNodes = [
  {
    fpid: 'FP-001',
    slug: 'elon-musk',
    full_name: 'Elon Musk',
    image_url: 'https://example.com/elon.jpg',
  },
  {
    fpid: 'FP-002',
    slug: 'jeff-bezos',
    full_name: 'Jeff Bezos',
    image_url: 'https://example.com/jeff.jpg',
  },
  {
    fpid: 'FP-003',
    slug: 'albert-einstein',
    full_name: 'Albert Einstein',
    image_url: 'https://example.com/einstein.jpg',
  },
];

export const mockExpectedEdges = [
  {
    source_fpid: 'FP-001',
    target_fpid: 'FP-002',
    relation_type: 'colleague',
    label: 'Colleague',
    start_date: '2020-01-01',
    end_date: null,
    direction: 'outgoing',
  },
  {
    source_fpid: 'FP-002',
    target_fpid: 'FP-001',
    relation_type: 'competitor',
    label: 'Competed with',
    start_date: '2015-01-01',
    end_date: null,
    direction: 'incoming',
  },
  {
    source_fpid: 'FP-001',
    target_fpid: 'FP-003',
    relation_type: 'friend',
    label: 'Friend',
    start_date: '2018-05-15',
    end_date: '2020-12-31',
    direction: 'outgoing',
  },
];
