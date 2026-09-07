# My Akkhara — Khmer Handwriting Recognition

## Overview

**My Akkhara** is a planned Khmer handwriting recognition project that aims to develop a practical system for recognizing handwritten Khmer text from images and converting it into digital, machine-readable Khmer Unicode text.

The project focuses on the challenges of **Khmer handwritten text recognition**, including writer variation, writing styles, image quality, limited training data, and the characteristics of the Khmer script.

The initial stage of My Akkhara is focused on literature review, dataset exploration, and model experimentation. In the longer term, the project aims to become an end-to-end Khmer handwriting recognition system.

---

## Project Goals

The main goals of My Akkhara are to:

- Collect and prepare a diverse Khmer handwritten dataset.
- Build reliable annotations/transcriptions for handwritten Khmer images.
- Study existing Khmer OCR and handwriting recognition approaches.
- Develop and compare modern deep learning recognition models.
- Explore transfer learning for low-resource Khmer handwriting recognition.
- Investigate language-model and decoder techniques for improving recognition.
- Evaluate models using appropriate handwriting recognition metrics.
- Build a foundation for a practical Khmer handwriting recognition application.

---

## Why Khmer Handwriting Recognition?

Handwritten text recognition is more challenging than printed OCR because handwriting can vary significantly between writers, writing styles, character sizes, spacing, and image quality.

For Khmer, the challenge is particularly interesting because Khmer handwriting recognition is a relatively low-resource research area compared with languages such as English. Existing research has explored CNN-based recognition, compact deep learning models, attention-based sequence-to-sequence architectures, historical Khmer documents, and Khmer-specific OCR datasets.

My Akkhara aims to build on this research while focusing specifically on **handwritten Khmer text** and developing a reproducible research pipeline.

---

## Planned Research Direction

### 1. Dataset

The project will investigate:

- Collection of handwritten Khmer samples from multiple writers.
- Different writing styles and levels of handwriting quality.
- Image-level and line-level annotations.
- Consistent Khmer Unicode transcription.
- Training, validation, and test splits that avoid writer leakage.

### 2. Image Preprocessing

Potential preprocessing methods include:

- Image resizing and normalization.
- Grayscale conversion where appropriate.
- Noise reduction.
- Contrast normalization.
- Data augmentation.
- Handwritten text-line or word segmentation.

### 3. Recognition Models

Potential model families to investigate include:

- CNN-based feature extractors.
- CNN-BiLSTM models.
- CTC-based handwriting recognition.
- Encoder-decoder architectures.
- Attention-based Seq2Seq models.
- Transformer-based handwriting recognition.
- Pretrained handwriting recognition models.

### 4. Transfer Learning

Because Khmer handwriting is a low-resource problem, pretrained handwriting recognition models may provide a useful starting point.

The project will investigate:

- Fine-tuning pretrained models.
- Single-writer and multi-writer adaptation.
- Domain adaptation.
- Comparison between training from scratch and fine-tuning.

### 5. Language Modeling

A Khmer language model or language-aware decoding approach may help resolve ambiguous visual predictions by using the linguistic context of the text.

---

## Possible System Pipeline

```text
Handwritten Khmer Image
          │
          ▼
   Image Preprocessing
          │
          ▼
 Text Line / Word Detection
          │
          ▼
 Visual Feature Extractor
       (CNN / ViT)
          │
          ▼
 Sequence Encoder
   (BiLSTM / Transformer)
          │
          ▼
 Recognition Decoder
   (CTC / Attention)
          │
          ▼
 Khmer Language Model
       (Optional)
          │
          ▼
 Khmer Unicode Text
```

The final architecture will depend on dataset characteristics and experimental results.

---

## Evaluation

The project should evaluate recognition performance using metrics such as:

- **Character Error Rate (CER)**
- **Word Error Rate (WER)**
- Sequence accuracy
- Writer-level performance
- Error analysis by character and word

CER will be particularly important because character-level recognition errors can provide detailed information about which Khmer characters or character combinations are difficult for the model.

---

# Related Research

The following references were collected as starting points for the My Akkhara literature review. Links are retained so that the original papers and publication records can be accessed.

> **Note:** Some references originally had incomplete author information. Those entries should be verified against the publisher, DOI, conference proceedings, or original preprint before being used in a final academic bibliography.

### Khmer Handwriting and OCR

1. **Annanurov, B., & Noor, N. M. (2018).**  
   *Khmer Handwritten Text Recognition with Convolution Neural Networks.*  
   ARPN Journal of Engineering and Applied Sciences, 13(22), 8828–8833.  
   - [ARPN PDF](https://www.arpnjournals.org/jeas/research_papers/rp_2018/jeas_1118_7396.pdf)

2. **Annanurov, B. (2021).**  
   *A Compact Deep Learning Model for Khmer Handwritten Text Recognition.*  
   IAES International Journal of Artificial Intelligence, 10(3), 584–591.  
   - [IAES Article](https://ijai.iaescore.com/index.php/IJAI/article/view/20919)

3. **Annanurov, B., & Noor, N. M. (2016).**  
   *Handwritten Khmer Text Recognition.*  
   - [ResearchGate](https://www.researchgate.net/publication/319370715_Handwritten_Khmer_text_recognition)  
   - DOI: `10.1109/WIECON-ECE.2016.8009112`

4. **Born, S., Valy, D., & Kong, P. (2022).**  
   *Encoder-Decoder Language Model for Khmer Handwritten Text Recognition in Historical Documents.*  
   - [ResearchGate](https://www.researchgate.net/publication/368317173_Encoder-Decoder_Language_Model_for_Khmer_Handwritten_Text_Recognition_in_Historical_Documents)  
   - DOI: `10.1109/SKIMA57145.2022.10029532`

5. **Valy, D., Verleysen, M., Chhun, S., & Burie, J.-C. (2017).**  
   *A New Khmer Palm Leaf Manuscript Dataset for Document Analysis and Recognition: SleukRith Set.*  
   Proceedings of the 4th International Workshop on Historical Document Imaging and Processing (HIP), 1–6.  
   - [ResearchGate](https://www.researchgate.net/publication/322236154_A_New_Khmer_Palm_Leaf_Manuscript_Dataset_for_Document_Analysis_and_Recognition_SleukRith_Set)  
   - DOI: `10.1145/3151509.3151510`

6. **Nom, V., Bakkali, S., Luqman, M. M., Coustaty, M., & Ogier, J.-M. (2024).**  
   *KhmerST: A Low-Resource Khmer Scene Text Detection and Recognition Benchmark.*  
   - [arXiv](https://arxiv.org/abs/2410.18277)  
   - [CVF Open Access](https://openaccess.thecvf.com/content/ACCV2024/html/Nom_KhmerST_A_Low-Resource_Khmer_Scene_Text_Detection_and_Recognition_Benchmark_ACCV_2024_paper.html)

7. **Buoy, R., Taing, N., Chenda, S., & Kor, S. (2022).**  
   *Khmer Printed Character Recognition Using Attention-Based Seq2Seq Network.*  
   Ho Chi Minh City Open University Journal of Science – Engineering and Technology, 12(1), 3–16.  
   - [Journal Article](https://journalofscience.ou.edu.vn/index.php/tech-en/article/view/2217)  
   - DOI: `10.46223/HCMCOUJS.tech.en.12.1.2217.2022`

8. **Buoy, R., Kor, S., & Taing, N. (2021).**  
   *An End-to-End Khmer Optical Character Recognition Using Sequence-to-Sequence with Attention.*  
   arXiv:2106.10875.  
   - [arXiv](https://arxiv.org/abs/2106.10875)

9. **Sokphyrum, K., Samak, S., & Sola, J. (2019).**  
   *Khmer OCR Fine Tune Engine for Unicode and Legacy Fonts Using Tesseract 4.0 with Deep Neural Network.*  
   Optical Character Recognition for Complex Scripts and Natural Language Processing for ASEAN Languages.  
   - Publication details should be verified from the original workshop/conference source.

---

## General Handwriting Recognition Research

10. **Pippi, V., Cascianelli, S., Kermorvant, C., & Cucchiara, R. (2023).**  
    *How to Choose Pretrained Handwriting Recognition Models for Single Writer Fine-Tuning.*  
    Document Analysis and Recognition – ICDAR 2023, LNCS 14188.  
    - [arXiv](https://arxiv.org/abs/2305.02593)  
    - [University publication record](https://iris.unimore.it/handle/11380/1363931)  
    - DOI: `10.1007/978-3-031-41679-8_19`

11. **Kohút, J., & Hradis, M. (2023).**  
    *Fine-Tuning Is a Surprisingly Effective Domain Adaptation Baseline in Handwriting Recognition.*  
    - [arXiv](https://arxiv.org/abs/2302.06308)  
    - [ResearchGate](https://www.researchgate.net/publication/373227313_Fine-Tuning_is_a_Surprisingly_Effective_Domain_Adaptation_Baseline_in_Handwriting_Recognition)

12. **Abdulkader, A., Revow, M., & Haluptzok, P.**  
    *Personalization of an Online Handwriting Recognition System.*  
    - [Paper PDF](https://citeseerx.ist.psu.edu/document?doi=e2ce00ac75a931faebaa6bfc09bff0cd8bfe9212&repid=rep1&type=pdf)

13. **CNN-BiLSTM Model for English Handwriting Recognition: Comprehensive Evaluation on the IAM Dataset (2023).**  
    - arXiv:2307.00664  
    - [arXiv](https://arxiv.org/abs/2307.00664)  
    - Authors should be verified before final citation.

14. **Kumari, L., Singh, S., Rathore, V. V. S., & Sharma, A. (2022).**  
    *A Comprehensive Handwritten Paragraph Text Recognition System: LexiconNet.*  
    arXiv:2205.11018.  
    - [arXiv](https://arxiv.org/abs/2205.11018)

15. **Chung, J., & Delteil, T. (2019).**  
    *A Computationally Efficient Pipeline Approach to Full Page Offline Handwritten Text Recognition.*  
    arXiv:1910.00663.  
    - [arXiv](https://arxiv.org/abs/1910.00663)

---

## Research Themes for My Akkhara

| Research area | Relevance |
|---|---|
| Khmer handwritten recognition | Core research problem |
| Khmer OCR | Provides related methods and baselines |
| Sequence-to-sequence recognition | Potential end-to-end recognition approach |
| Attention mechanisms | Useful for sequence prediction |
| CTC | Potential alignment-free training approach |
| Transfer learning | Important for low-resource data |
| Domain adaptation | Useful for different writers and datasets |
| Language modeling | Can improve contextual predictions |
| Historical Khmer documents | Potential future application |
| Khmer datasets and benchmarks | Important for reproducible evaluation |

---

## Suggested Repository Structure

```text
my-akkhara/
│
├── README.md
├── requirements.txt
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── annotations/
│
├── notebooks/
│
├── src/
│   ├── preprocessing/
│   ├── models/
│   ├── training/
│   ├── evaluation/
│   └── inference/
│
├── configs/
├── checkpoints/
├── results/
│
└── docs/
```

---

## Current Status

**Status: Research planning / literature review**

The current focus is on:

1. Reviewing existing Khmer handwriting recognition research.
2. Identifying available Khmer handwritten datasets.
3. Understanding suitable annotation formats.
4. Selecting strong baseline models.
5. Designing experiments for low-resource Khmer handwriting recognition.
6. Building the first version of the recognition pipeline.

---

## Long-Term Vision

My Akkhara aims to contribute toward better digital accessibility for handwritten Khmer text.

The long-term vision is an end-to-end system where a user can provide an image containing handwritten Khmer text and receive accurate, editable Khmer Unicode text.

Potential future applications include:

- Digitizing handwritten documents.
- Searching handwritten Khmer documents.
- Preserving historical documents.
- Assisting document transcription.
- Supporting educational and archival applications.
- Providing APIs or tools for Khmer handwriting recognition.

---

## Acknowledgement of Related Research

My Akkhara builds upon previous research in Khmer OCR, handwritten text recognition, document analysis, deep learning, sequence-to-sequence recognition, and handwriting model adaptation.

The references above are intended as a starting point for the project's literature review and should be updated as the research progresses.
