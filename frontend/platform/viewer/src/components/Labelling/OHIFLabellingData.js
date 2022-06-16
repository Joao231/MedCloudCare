const items = [
  'Abdomen/Chest_Wall',
  'Adrenal',
  'Bladder',
  'Bone',
  'Brain',
  'Breast',
  'Colon',
  'Esophagus',
  'Extremities',
  'Gallbladder',
  'Kidney',
  'Knee',
  'Liver',
  'Lung',
  'Lymph_Node',
  'Mediastinum/Hilum',
  'Muscle',
  'Neck',
  'Other_Soft_Tissue',
  'Ovary',
  'Pancreas',
  'Pelvis',
  'Peritoneum/Omentum',
  'Prostate',
  'Retroperitoneum',
  'Small_Bowel',
  'Spleen',
  'Stomach',
  'Subcutaneous',
];

const OHIFLabellingData = items.map(item => {
  return {
    label: item,
    value: item,
  };
});

export default OHIFLabellingData;
