# PolyVis ![CI](https://github.com/AlexanderGruebling/PolyVis/actions/workflows/ci.yml/badge.svg)
Repository of PolyVis, a project created as part of my bachelor thesis in Bioinformatics. It aims at visualizing data from Polysomnography and helping to diagnose the different forms of sleep apnea.

**Live demo:** [alexandergruebling.github.io/PolyVis](https://alexandergruebling.github.io/PolyVis/)

## Screenshots
![img.png](Documentation/img.png)

## Installation and Execution

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`

### Local SHHS Dataset (Optional)

The app ships with a single hardcoded patient. To enable the full multi-patient library with the SHHS cohort (5,804 participants):

1. Create a `.env` file in the project root:
   ```env
   VITE_SHH_DATASET_ENABLED=true
   VITE_SHH_DATASET_FILE=shhs-datasets/shhs1-dataset-0.21.0.csv
   ```
2. Symlink your SHHS dataset directory into `public/` (this is not committed):
   ```bash
   ln -s ~/shhs/datasets public/shhs-datasets
   ```
3. Restart the dev server.

The `.env` file is gitignored — the multi-patient catalog is only available in local development and will not appear in the production build.