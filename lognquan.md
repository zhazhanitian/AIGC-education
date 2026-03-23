# 2025年项目实施进展情况
- 项目名称：基于生成式AI设计的龙泉青瓷数字化系统研究及应用
- 任务编号：2025SDXT005-5
- 任务承担单位：中国美术学院龙泉研究院
- 任务负责人：周武

## 一、检查时间点与覆盖范围
- 统计截止：2025-12-30
- 覆盖内容：对照任务书计划进度目标（2025年两阶段）、五个子课题年度推进、2025年度阶段性成果与技术路线落地情况

## 二、总体技术路线（2025年度落地）
### 1. 数据—模型—系统闭环
- 数据层：材料基因数据库（釉色-配方-工艺-烧成-表征-样品）结构化入库 + 影像/纹理/釉面特征向量化检索
- 模型层：CLIP跨模态对齐（术语↔釉色/纹理/器型），Stable Diffusion/SDXL LoRA 领域微调，GAN釉面高保真仿真，VAE解耦（器型结构/釉面特征）
- 系统层：数据录入/治理、提示词与检索增强（RAG）、生成任务编排（LCM/Turbo加速）、结果评测与版本管理
- 验证层：离线评测（CLIPScore/LPIPS/FID/一致性）、专家盲评、典型器型/釉色基准集回归测试

### 2. 关键技术关键词（按任务书与可行性报告）
- 釉色-配方-工艺动态预测（特征提取 + 回归/树模型 + 约束优化）
- CLIP跨模态语义对齐（术语、釉色色谱、纹理特征）
- GAN釉面仿真（不同配方/工艺参数下的高保真图像模拟）
- PBR物理渲染（光泽模拟、分层扩散策略）
- 稳定扩散/风格迁移（梯度引导、风格编码库、LCM加速）

## 三、2025年上半年工作内容与完成情况（2025-01-01至2025-06-30）
### 1) 材料基因数据库（初步框架 + 数据录入）
- 数据模型与字段体系确定：釉色、原料配比、添加剂、烧成曲线（升温/保温/降温）、窑型/气氛、样品尺寸/批次、表征指标（色度LAB值/光泽度/显微纹理形貌）
- 完成数据录入与校验流程：字段必填校验、单位换算、版本追踪、批量导入（CSV/Excel）与附件关联（照片/显微图/光谱）
- 建立釉面影像与纹理特征抽取管线：颜色直方图、GLCM纹理、频域特征 + CLIP image embedding 入库

### 2) 模型与算法方案（造型/材质迁移/效果图渲染）
- 器型结构库：收集并结构化典型器型参数（高度/口径/肩部曲率/腹径/底足）并形成可参数化模板
- 文生图方案确定：以SDXL为底座，按器型/釉色/纹饰三类概念分别训练LoRA；提示词由“术语模板 + 检索增强（向量召回）+ 约束槽位”拼装
- 材质迁移方案确定：以ControlNet（边缘/深度）约束结构，LoRA控制釉色/纹理；支持局部Mask重绘实现釉色局部迁移

## 四、2025年下半年工作内容与完成情况（2025-07-01至2025-12-31）
### 1) 数据库完善（80%填充 + 多维分析）
- 材料基因数据库：已完成80%数据填充
- 多维分析：支持按釉色类别（梅子青/粉青/豆青等）、配方区间、烧成制度、窑炉气氛进行筛选与相关性分析
- “釉色-配方-工艺”动态预测原型：建立多任务学习特征集（配方/工艺→色度/光泽/缺陷概率），输出可视化预判（区间置信度）

### 2) 文生图关联系统（≥80%功能）
- CLIP语义对齐：术语词表清洗、同义词归并、术语→embedding；实现“术语→釉色/纹理/器型”TopK召回与证据可追溯
- 生成编排：支持批量任务、随机种子复现、负向提示词、分辨率/步数/CFG/采样器配置（集成LCM调度器实现秒级生成）、版本冻结
- 釉面仿真：初步构建GAN仿真模块，模拟不同工艺参数下的开片与气泡细节
- 评测与回归：建立基准提示词集与对照组（通用SDXL vs 领域LoRA），周级回归生成集

### 3) 知识产权
- 软件著作权：已完成申报（1项）；完成第2项软著代码开发与文档准备
- 学术论文：完成1篇研究性论文撰写并投稿

## 五、2025年度关键量化指标（截至2025-12-30）
| 指标项 | 任务书/年度要求 | 2025年完成值 |
| --- | --- | --- |
| 有效验证数据条目（工艺参数数据数量） | 2025年度：100条 | 612条 |
| 材料基因数据库填充度 | 2025年度：80% | 80% |
| 数据库累计记录数（配方/工艺/烧成/表征关联记录） | - | 920条 |
| 釉面影像与附件入库 | - | 23,480张 |
| 术语词表规模（清洗归一后） | - | 612项 |
| 文生图关联系统完成度 | 2025年度：≥80% | 84% |
| 领域LoRA版本 | - | 6个（器型2/釉色3/纹饰1） |
| 基准提示词回归用例 | - | 180条 |
| AIGC功能开发-草图生成效果图 | - | 完成度60% |
| AIGC功能开发-风格材质迁移 | - | 完成度40% |
| AIGC功能开发-3D模型生成 | - | 完成度70% |

## 六、五个子课题推进情况（2025年度细化）
### 子课题一：龙泉青瓷釉料数据库与配方优化
- 承担单位：中国美术学院龙泉研究院
- 合作单位：中国美术学院、浙江天丰陶瓷有限公司

#### 1.1 研究目标（任务书）
构建基于材料基因数据库的釉色配方优化体系，分析釉料成分、烧制参数与釉面特征的关联关系，建立"釉色-配方-工艺"动态预测模型，实现目标釉色的配方智能推荐与烧成效果可视化预判。

#### 1.2 2025年度工作进展
##### （1）数据库架构与治理
- 完成"釉色-配方-工艺-烧成-表征-样品"六表联动主数据模型设计
- 上线批量导入（CSV/Excel）与质检规则集：缺失检测、异常值检测、重复记录检测
- 建立字段规范：氧化物摩尔分数（SiO₂/Al₂O₃/CaO/K₂O+Na₂O/Fe₂O₃）、烧成曲线特征（峰值温度/升温速率/保温时长/气氛标签）
- 附件关联：釉面照片、显微SEM图、XRF光谱、色度仪报告

##### （2）核心表征指标体系
| 指标类别 | 具体字段 | 采集设备/方法 | 精度要求 |
| --- | --- | --- | --- |
| 色度 | Lab* (CIE 1976) | 分光测色仪 (D65光源) | ΔE*ab < 0.5 |
| 光泽度 | 60°/85°镜面光泽 | 光泽度仪 | ±0.5 GU |
| 纹理形貌 | 开片密度、气泡率、表面粗糙度 | 光学显微镜 + 图像分析 | 5μm分辨率 |
| 缺陷概率 | 针孔/流釉/起泡/缩釉 | 人工标注 + CNN辅助 | 准确率>90% |

##### （3）配方预测模型原型
- 输入特征：配方成分向量（8维氧化物）+ 烧成曲线特征（6维）+ 窑炉类型编码
- 输出目标：色度预测（Lab*）、光泽预测、缺陷概率（多任务学习）
- 模型架构：XGBoost集成 + 残差MLP精调
- 验证结果：色度预测MAE < 2.5（Lab*空间），缺陷预测AUC > 0.82

##### （4）配方推荐策略
- 相似釉色召回：基于LAB色度空间的KNN检索（K=20）
- 约束优化：原料上下限、成本约束、可烧成窗口（温度±30°C）
- TopN输出：返回5组候选配方及置信区间

#### 1.3 2025年度量化成果
| 指标 | 完成值 |
| --- | --- |
| 累计配方记录 | 380条 |
| 烧成曲线记录 | 286条 |
| 表征观测记录 | 920条 |
| 釉面影像入库 | 23,480张 |
| 有效验证数据（核心字段完备） | 612条 |
| 配方预测模型版本 | v0.3 |

#### 1.4 技术实现（代码节选）
```sql
-- 数据库核心表结构（完整版）
CREATE TABLE glaze_recipe (
  recipe_id TEXT PRIMARY KEY,
  glaze_name TEXT NOT NULL,
  target_glaze_family TEXT,           -- 梅子青/粉青/豆青/天青/灰青...
  -- 氧化物摩尔分数
  oxide_siO2 REAL CHECK(oxide_siO2 BETWEEN 0 AND 1),
  oxide_al2o3 REAL CHECK(oxide_al2o3 BETWEEN 0 AND 1),
  oxide_caO REAL CHECK(oxide_caO BETWEEN 0 AND 1),
  oxide_mgO REAL,
  oxide_k2o_na2o REAL,
  oxide_fe2o3 REAL,
  oxide_tio2 REAL,
  oxide_p2o5 REAL,
  -- 原料配比
  raw_material_json TEXT,             -- JSON: {"长石": 35, "石英": 25, ...}
  additive_list TEXT,
  batch_size_kg REAL,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE firing_profile (
  profile_id TEXT PRIMARY KEY,
  kiln_type TEXT,                     -- 气窑/电窑/柴窑/混合窑
  atmosphere TEXT,                    -- 氧化/还原/弱还原/中性
  peak_temp_c REAL CHECK(peak_temp_c BETWEEN 800 AND 1400),
  ramp_rate_c_per_h REAL,             -- 升温速率
  soak_min REAL,                      -- 保温时间
  soak_temp_c REAL,                   -- 保温温度
  cooling_rate_c_per_h REAL,          -- 冷却速率
  total_firing_hours REAL,
  curve_json TEXT                     -- 完整温度曲线 JSON
);

CREATE TABLE glaze_observation (
  obs_id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  sample_id TEXT,
  -- 色度指标 (CIE L*a*b*)
  lab_L REAL, lab_a REAL, lab_b REAL,
  delta_e REAL,                       -- 与目标色差
  -- 光泽度
  gloss_60deg REAL,
  gloss_85deg REAL,
  -- 缺陷概率 (0-1)
  defect_pinhole REAL, defect_crawl REAL, 
  defect_bubble REAL, defect_shrink REAL,
  -- 纹理特征
  crackle_density REAL,               -- 开片密度
  surface_roughness REAL,             -- 表面粗糙度 (Ra)
  -- 附件
  image_uri TEXT,
  sem_uri TEXT,
  xrf_uri TEXT,
  observer TEXT,
  observed_at TEXT,
  FOREIGN KEY(recipe_id) REFERENCES glaze_recipe(recipe_id),
  FOREIGN KEY(profile_id) REFERENCES firing_profile(profile_id)
);

-- 创建索引加速检索
CREATE INDEX idx_glaze_family ON glaze_recipe(target_glaze_family);
CREATE INDEX idx_atmosphere ON firing_profile(atmosphere);
CREATE INDEX idx_lab ON glaze_observation(lab_L, lab_a, lab_b);
```

```python
# 配方预测模型训练（节选）
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

class GlazePredictionModel:
    def __init__(self):
        self.color_model = xgb.XGBRegressor(
            n_estimators=200, max_depth=6, learning_rate=0.05,
            objective='reg:squarederror', tree_method='hist'
        )
        self.defect_model = xgb.XGBClassifier(
            n_estimators=150, max_depth=5, learning_rate=0.08,
            objective='binary:logistic', eval_metric='auc'
        )
    
    def prepare_features(self, recipe_df, firing_df):
        """合并配方与烧成特征"""
        oxide_cols = ['oxide_siO2', 'oxide_al2o3', 'oxide_caO', 
                      'oxide_mgO', 'oxide_k2o_na2o', 'oxide_fe2o3']
        firing_cols = ['peak_temp_c', 'ramp_rate_c_per_h', 'soak_min',
                       'cooling_rate_c_per_h', 'atmosphere_encoded']
        features = pd.merge(recipe_df[oxide_cols], firing_df[firing_cols], ...)
        return features
    
    def train_color_model(self, X, y_lab):
        """训练色度预测（L*a*b*三通道）"""
        X_train, X_val, y_train, y_val = train_test_split(X, y_lab, test_size=0.2)
        self.color_model.fit(X_train, y_train)
        y_pred = self.color_model.predict(X_val)
        mae = mean_absolute_error(y_val, y_pred)
        print(f"Color prediction MAE: {mae:.3f}")
        return mae

    def recommend_recipe(self, target_lab, constraints, topk=5):
        """基于目标色度推荐配方"""
        # 1. KNN召回相似釉色
        candidates = self.knn_search(target_lab, k=20)
        # 2. 约束过滤（成本/原料/温度窗口）
        filtered = self.apply_constraints(candidates, constraints)
        # 3. 预测排序
        scores = self.predict_match_score(filtered, target_lab)
        return filtered.nlargest(topk, 'score')
```

### 子课题二：龙泉青瓷高关联性提示词生成设计图研究
- 承担单位：中国美术学院龙泉研究院
- 合作单位：丽水学院、无锡供春人工智能科技有限公司

#### 2.1 研究目标（任务书）
基于CLIP模型构建跨模态语义对齐框架，实现专业术语与釉色色谱、纹理特征的精确匹配；集成龙泉青瓷典型器型结构库与纹样特征库，实现文本指令到设计图的精准生成。

#### 2.2 2025年度工作进展
##### （1）术语体系构建
- 术语采集：从文献、工匠访谈、产品目录中采集原始术语 1,200+项
- 术语清洗：同义词归并（如"梅子青"="梅青"="青梅色"）、缩写展开、歧义项拆分
- 最终词表：612项规范化术语，覆盖釉色（86项）、纹理（54项）、器型（78项）、纹饰（92项）、光学特性（45项）、工艺约束（257项）

##### （2）跨模态语义对齐
- 文本编码：采用 CLIP ViT-L/14 文本编码器，术语→768维embedding
- 图像编码：釉面样本图像→CLIP image embedding，入向量数据库（Milvus）
- 对齐训练：在领域数据集上进行对比学习微调，提升"术语↔釉面图像"匹配精度
- 检索能力：TopK召回（K=8），返回相似釉色/纹理/器型的证据样本

##### （3）提示词编排系统
- 结构化槽位：shape / glaze / pattern / optical / constraints / negative
- 检索增强：根据用户输入术语，自动召回相似样本作为参考，融入提示词
- 负向约束库：积累 120+ 负向提示词，抑制常见生成缺陷（塑料感、油画笔触、裂纹伪影）

##### （4）生成质量评测
- 基准提示词集：180条标准化提示词（覆盖主要器型×釉色组合）
- 评测指标：CLIP Score（文图相关性）、LPIPS（感知相似度）、专家盲评
- 对照实验：领域LoRA vs 通用SDXL，CLIP Score 提升 23%

#### 2.3 2025年度量化成果
| 指标 | 完成值 |
| --- | --- |
| 术语词表规模 | 612项 |
| 术语embedding入库 | 612条 |
| 釉面图像embedding入库 | 23,480条 |
| 基准提示词用例 | 180条 |
| CLIP Score（领域LoRA） | 0.312 |
| CLIP Score提升（vs通用SDXL） | +23% |
| 系统功能测试轮次 | 10轮 |

#### 2.4 技术实现（代码节选）
```python
# CLIP跨模态对齐与检索（节选）
import torch
import clip
from pymilvus import Collection

class CeladonCLIPRetriever:
    def __init__(self, model_path="ViT-L/14"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load(model_path, device=self.device)
        self.collection = Collection("celadon_embeddings")
    
    def encode_text(self, terms: list) -> torch.Tensor:
        """术语列表编码为CLIP embedding"""
        text_inputs = clip.tokenize(terms).to(self.device)
        with torch.no_grad():
            text_features = self.model.encode_text(text_inputs)
            text_features /= text_features.norm(dim=-1, keepdim=True)
        return text_features.cpu().numpy()
    
    def encode_image(self, image_path: str) -> torch.Tensor:
        """釉面图像编码"""
        from PIL import Image
        image = self.preprocess(Image.open(image_path)).unsqueeze(0).to(self.device)
        with torch.no_grad():
            image_features = self.model.encode_image(image)
            image_features /= image_features.norm(dim=-1, keepdim=True)
        return image_features.cpu().numpy()
    
    def retrieve_similar(self, query_embedding, topk=8, modality="image"):
        """向量检索：返回相似釉色/纹理/器型样本"""
        search_params = {"metric_type": "IP", "params": {"nprobe": 16}}
        results = self.collection.search(
            data=[query_embedding.flatten().tolist()],
            anns_field="embedding",
            param=search_params,
            limit=topk,
            output_fields=["sample_id", "glaze_family", "image_uri"]
        )
        return results[0]  # 返回TopK结果
    
    def compute_clip_score(self, prompt: str, image_path: str) -> float:
        """计算提示词与生成图像的CLIP Score"""
        text_emb = self.encode_text([prompt])
        image_emb = self.encode_image(image_path)
        score = (text_emb @ image_emb.T).item()
        return score
```

```json
{
  "prompt_template_v2": {
    "system": "你是龙泉青瓷设计专家，根据以下结构化描述生成酒瓶设计图",
    "slots": {
      "shape": {
        "base": "酒瓶",
        "profile": "{shape_profile}",
        "proportion": "{height}cm高，{diameter}cm腹径，{shoulder_type}肩部"
      },
      "glaze": {
        "family": "{glaze_family}",
        "texture": "{glaze_texture}",
        "optical": "{optical_property}",
        "thickness": "{glaze_thickness}"
      },
      "pattern": {
        "style": "{pattern_style}",
        "density": "{pattern_density}",
        "position": "{pattern_position}"
      },
      "lighting": "柔和自然光，轻微高光，展示釉面质感",
      "background": "纯色背景，突出器型轮廓"
    },
    "negative_prompt": [
      "low quality", "blurry", "watermark", "text", "logo",
      "over-saturated", "plastic texture", "oil painting brush strokes",
      "cracked glaze artifacts", "unrealistic reflections",
      "distorted shape", "asymmetric", "floating objects"
    ],
    "retrieval_config": {
      "topk_glaze_images": 8,
      "topk_terms": 12,
      "fusion_weights": {"clip_image": 0.6, "clip_text": 0.4},
      "evidence_injection": true
    }
  }
}
```

### 子课题三：龙泉青瓷草图多特征材质迁移研究
- 承担单位：中国美术学院龙泉研究院
- 合作单位：丽水学院、中国美术学院

#### 3.1 研究目标（任务书）
基于稳定扩散模型与GAN，通过LoRA微调技术实现轮廓、釉色、纹理的多维度特征分离与重组，支持梅子青、粉青等釉色的局部迁移与全局融合，实现手绘草图到高保真釉色效果图智能转换。

#### 3.2 2025年度工作进展
##### （1）草图数据集构建
- 数据采集：收集手绘草图 450张、线稿 620张、边缘图 620张
- 配对标注：草图-线稿-边缘图-目标釉色参考 四元组标注
- 数据增强：随机裁剪、色彩抖动、线条粗细变换

##### （2）多特征分离架构
| 特征类型 | LoRA名称 | 训练样本 | 控制目标 |
| --- | --- | --- | --- |
| 轮廓结构 | lora_shape_bottle | 1,200张 | 器型轮廓、肩腹比例、底足形态 |
| 釉色色域 | lora_glaze_meiziqing | 800张 | 梅子青色域控制 |
| 釉色色域 | lora_glaze_fenqing | 650张 | 粉青色域控制 |
| 釉色色域 | lora_glaze_douqing | 480张 | 豆青色域控制 |
| 纹理肌理 | lora_texture_celadon | 920张 | 釉面细腻/开片/冰裂纹理 |
| 纹饰风格 | lora_pattern_simple | 380张 | 简化纹饰风格 |

##### （3）迁移链路设计
- 结构约束：ControlNet（Canny边缘 / Lineart线稿 / Depth深度）保持器型结构
- 釉色控制：釉色LoRA控制整体色域
- 纹理叠加：纹理LoRA控制釉面肌理（细腻/开片/冰裂）
- 局部重绘：Mask Inpaint支持局部釉色迁移（如仅改变瓶身釉色，保留瓶口）

##### （4）组合推理能力
- 支持多LoRA权重叠加：glaze_weight × 釉色LoRA + texture_weight × 纹理LoRA
- 动态权重调节：用户可实时调整釉色/纹理强度
- 组合稳定性测试：180条基准提示词×6种LoRA组合，结构一致性>92%

#### 3.3 2025年度量化成果
| 指标 | 完成值 |
| --- | --- |
| 草图数据集规模 | 450张 |
| 配对标注四元组 | 620组 |
| 训练LoRA数量 | 6个 |
| LoRA训练总步数 | 48,000步 |
| 组合推理结构一致性 | 92.3% |
| 材质迁移测试轮次 | 10轮 |

#### 3.4 技术实现（代码节选）
```python
# 多LoRA组合推理与ControlNet约束（节选）
import torch
from diffusers import StableDiffusionXLControlNetPipeline, ControlNetModel
from diffusers import LCMScheduler

class CeladonMaterialTransfer:
    def __init__(self):
        # 加载ControlNet（线稿约束）
        self.controlnet = ControlNetModel.from_pretrained(
            "lllyasviel/sd-controlnet-lineart",
            torch_dtype=torch.float16
        )
        # 加载基础模型
        self.pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            controlnet=self.controlnet,
            torch_dtype=torch.float16
        ).to("cuda")
        # 启用LCM加速
        self.pipe.scheduler = LCMScheduler.from_config(self.pipe.scheduler.config)
        
    def load_loras(self, lora_configs: list):
        """加载多个LoRA并设置权重"""
        for config in lora_configs:
            self.pipe.load_lora_weights(
                config["path"],
                weight_name="pytorch_lora_weights.safetensors",
                adapter_name=config["name"]
            )
        # 设置LoRA权重
        adapter_weights = {c["name"]: c["weight"] for c in lora_configs}
        self.pipe.set_adapters(list(adapter_weights.keys()), list(adapter_weights.values()))
    
    def transfer(self, sketch_image, prompt, lora_configs, 
                 controlnet_scale=0.8, num_steps=4, guidance_scale=1.5):
        """草图→效果图迁移"""
        self.load_loras(lora_configs)
        
        # 提取线稿
        lineart = self.extract_lineart(sketch_image)
        
        # 生成
        result = self.pipe(
            prompt=prompt,
            image=lineart,
            controlnet_conditioning_scale=controlnet_scale,
            num_inference_steps=num_steps,  # LCM仅需4步
            guidance_scale=guidance_scale
        ).images[0]
        
        return result
    
    def local_transfer(self, base_image, mask_image, target_glaze_lora, prompt):
        """局部釉色迁移（Inpaint）"""
        self.pipe.load_lora_weights(target_glaze_lora, adapter_name="local_glaze")
        result = self.pipe.inpaint(
            prompt=prompt,
            image=base_image,
            mask_image=mask_image,
            num_inference_steps=4
        ).images[0]
        return result

# 使用示例
transfer = CeladonMaterialTransfer()
lora_configs = [
    {"name": "glaze", "path": "./lora_glaze_meiziqing", "weight": 0.8},
    {"name": "texture", "path": "./lora_texture_celadon", "weight": 0.6}
]
result = transfer.transfer(
    sketch_image="sketch_bottle.png",
    prompt="龙泉青瓷酒瓶，梅子青釉色，釉面细腻，柔和高光",
    lora_configs=lora_configs
)
result.save("transferred_2025.png")
```

```yaml
# LoRA训练配置（釉色LoRA示例）
experiment_name: lora_glaze_meiziqing_v2
base_model: stabilityai/stable-diffusion-xl-base-1.0
data:
  train_data_dir: ./data/meiziqing_samples
  resolution: 1024
  caption_column: "prompt"
  image_column: "image"
  caption_strategy: "slot_prompt"
training:
  batch_size: 2
  gradient_accumulation_steps: 8
  learning_rate: 1.0e-4
  lr_scheduler: "cosine"
  lr_warmup_steps: 500
  max_train_steps: 8000
  mixed_precision: "fp16"
  optimizer: "adamw8bit"
  snr_gamma: 5.0
  seed: 42
lora:
  rank: 16
  alpha: 16
  target_modules: ["to_q", "to_k", "to_v", "to_out.0"]
  dropout: 0.05
augmentation:
  random_flip: true
  color_jitter: 0.08
  random_crop: 0.15
validation:
  validation_prompts:
    - "龙泉青瓷酒瓶，梅子青釉色，釉面光滑"
    - "龙泉青瓷花瓶，梅子青，开片纹理"
  validation_steps: 500
  num_validation_images: 4
```

### 子课题四：龙泉青瓷多风格迁移效果图生成技术研究
- 承担单位：中国美术学院龙泉研究院
- 合作单位：浙江天丰陶瓷有限公司、中国美术学院

#### 4.1 研究目标（任务书）
利用LoRA模型提取传统大师风格与现代艺术风格构建可扩展风格编码库；通过VAE模型解析设计图结构与风格，设计梯度引导的风格迁移算法，实现龙泉青瓷多样化风格效果。

#### 4.2 2025年度工作进展
##### （1）风格标签体系
- 一级分类：传统风格 / 现代风格 / 商业风格
- 二级分类：
  - 传统：宋韵古朴、官窑典雅、民窑质朴
  - 现代：极简主义、工业设计、艺术装置
  - 商业：产品陈列、广告展示、电商详情

##### （2）风格LoRA构建
| 风格名称 | LoRA版本 | 训练样本 | 风格特征 |
| --- | --- | --- | --- |
| 传统宋韵 | lora_style_songyin_v1 | 420张 | 素雅、古朴、温润、留白 |
| 现代极简 | lora_style_minimal_v1 | 380张 | 干净、几何、高对比、无装饰 |
| 商业陈列 | lora_style_commercial_v0 | 260张 | 高光、反射、产品感、专业布光 |

##### （3）渲染加速技术
- LCM调度器：采用Latent Consistency Models，将推理步数从30步压缩至4步
- 单图生成时间：从15-20秒压缩至 <3秒（NVIDIA RTX 4090）
- 批量生成：支持8图并行，吞吐量 >150张/分钟

##### （4）PBR物理渲染增强
- 光泽模拟：基于物理的反射模型（GGX微表面）
- 环境光遮蔽：SSAO算法增强釉面深度感
- 分层扩散：器型轮廓与釉色渐变分层控制

##### （5）梯度引导策略
- CFG动态区间：根据风格强度自动调节CFG（1.5~7.5）
- 负向提示词库：120+条，按风格分类抑制特定伪影
- 质量阈值：CLIP Score < 0.25 自动重新生成

#### 4.3 2025年度量化成果
| 指标 | 完成值 |
| --- | --- |
| 风格LoRA数量 | 3个（传统/现代/商业） |
| 风格样本库规模 | 1,060张 |
| LCM推理步数 | 4步 |
| 单图生成时间 | <3秒 |
| 批量吞吐量 | >150张/分钟 |
| 负向提示词库 | 120条 |

#### 4.4 技术实现（代码节选）
```python
# LCM加速 + PBR渲染管线（节选）
import torch
from diffusers import StableDiffusionXLPipeline, LCMScheduler
from diffusers.utils import load_image

class FastStyleRenderer:
    def __init__(self):
        self.pipe = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=torch.float16,
            variant="fp16"
        ).to("cuda")
        
        # 启用LCM调度器（4步快速推理）
        self.pipe.scheduler = LCMScheduler.from_config(self.pipe.scheduler.config)
        
        # 加载LCM-LoRA权重
        self.pipe.load_lora_weights("latent-consistency/lcm-lora-sdxl", adapter_name="lcm")
        
        # 风格LoRA库
        self.style_loras = {
            "songyin": "./lora_style_songyin_v1",
            "minimal": "./lora_style_minimal_v1",
            "commercial": "./lora_style_commercial_v0"
        }
        
    def load_style(self, style_name: str, weight: float = 0.7):
        """加载风格LoRA"""
        if style_name in self.style_loras:
            self.pipe.load_lora_weights(
                self.style_loras[style_name],
                adapter_name=style_name
            )
            # 组合LCM + 风格LoRA
            self.pipe.set_adapters(["lcm", style_name], [1.0, weight])
    
    def render(self, prompt: str, style: str = "songyin",
               num_images: int = 1, seed: int = None):
        """快速风格化渲染"""
        self.load_style(style)
        
        generator = torch.Generator("cuda").manual_seed(seed) if seed else None
        
        # PBR增强提示词
        pbr_prompt = f"{prompt}, photorealistic ceramic glaze, " \
                     f"subtle specular highlights, ambient occlusion, " \
                     f"professional product photography lighting"
        
        images = self.pipe(
            prompt=pbr_prompt,
            negative_prompt=self.get_negative_prompt(style),
            num_inference_steps=4,          # LCM仅需4步
            guidance_scale=1.5,             # LCM推荐低CFG
            num_images_per_prompt=num_images,
            generator=generator
        ).images
        
        return images
    
    def get_negative_prompt(self, style: str) -> str:
        """根据风格返回负向提示词"""
        base_negative = "low quality, blurry, watermark, text, logo, " \
                        "plastic texture, unrealistic, distorted"
        style_negative = {
            "songyin": ", modern elements, bright colors, glossy plastic",
            "minimal": ", ornate decorations, busy patterns, warm tones",
            "commercial": ", amateur lighting, shadows, muted colors"
        }
        return base_negative + style_negative.get(style, "")
    
    def batch_render(self, prompts: list, style: str, batch_size: int = 8):
        """批量渲染（高吞吐）"""
        results = []
        for i in range(0, len(prompts), batch_size):
            batch = prompts[i:i+batch_size]
            for prompt in batch:
                images = self.render(prompt, style, num_images=1)
                results.extend(images)
        return results

# 使用示例
renderer = FastStyleRenderer()
images = renderer.render(
    prompt="龙泉青瓷酒瓶，梅子青釉色，肩部圆润",
    style="songyin",
    num_images=4,
    seed=42
)
for i, img in enumerate(images):
    img.save(f"style_output_{i}.png")
```

### 子课题五：龙泉青瓷三维模型生成与快速打样技术研究
- 承担单位：中国美术学院龙泉研究院
- 合作单位：中国美术学院、浙江天丰陶瓷有限公司

#### 5.1 研究目标（任务书）
基于StructLDM模型构建多视角图像生成框架，实现高精度三维模型生成；结合直写成型3D打印技术，优化材料配方、成型工艺、烧成制度，实现龙泉青瓷快速制造。

#### 5.2 2025年度工作进展
##### （1）器型参数化模板库
- 建立酒瓶器型参数化描述规范：高度、口径、颈部长度、肩部曲率、腹径、底足直径
- 完成312个典型器型的参数化模板建档
- 支持参数化编辑与变形（保持比例约束）

##### （2）2D多视角标注规范
- 定义标准视角：正视（0°）、侧视（90°）、斜视（45°）、俯视、仰视
- 完成186组多视角标注样本（用于后续StructLDM训练数据准备）
- 建立视角一致性校验规则

##### （3）3D打印前置研究
- 直写成型（DIW）工艺参数初步调研：喷嘴直径、挤出速度、层高、填充率
- 青瓷膏体流变性研究：黏度区间、触变性、屈服应力
- 烧成收缩率预测模型初步构建

##### （4）快速打样数据规范
- 定义打样相关字段并纳入材料基因数据库：
  - 膏体配方、固含量、黏度
  - 打印参数（层高/速度/填充）
  - 干燥制度、素烧制度、釉烧制度
  - 收缩率、变形率、力学性能

##### （5）样品试制
- 完成样品试制及加工 20批次
- 收集打印-烧成-检测闭环数据
- 初步验证直写成型可行性

#### 5.3 2025年度量化成果
| 指标 | 完成值 |
| --- | --- |
| 器型参数化模板 | 312个 |
| 多视角标注样本 | 186组 |
| 样品试制批次 | 20批次 |
| 膏体配方测试 | 15组 |
| 打印参数测试 | 8组 |
| 烧成制度测试 | 12组 |

#### 5.4 技术实现（代码/配置节选）
```python
# 器型参数化模板定义（节选）
from dataclasses import dataclass
from typing import Optional
import numpy as np

@dataclass
class BottleProfile:
    """酒瓶器型参数化描述"""
    # 基础尺寸 (mm)
    total_height: float          # 总高度
    mouth_diameter: float        # 口径
    neck_height: float           # 颈部高度
    neck_diameter: float         # 颈部直径
    shoulder_height: float       # 肩部高度
    shoulder_curve: float        # 肩部曲率 (0-1, 0=直角, 1=圆弧)
    belly_diameter: float        # 腹部最大直径
    belly_height: float          # 腹部最大直径位置高度
    foot_diameter: float         # 底足直径
    foot_height: float           # 底足高度
    
    # 可选装饰参数
    pattern_type: Optional[str] = None       # 纹饰类型
    pattern_position: Optional[str] = None   # 纹饰位置
    
    def to_control_points(self) -> np.ndarray:
        """转换为轮廓控制点（用于参数化建模）"""
        points = [
            [0, self.foot_height],                                    # 底足
            [self.foot_diameter/2, self.foot_height],
            [self.belly_diameter/2, self.belly_height],               # 腹部
            [self.neck_diameter/2 + (self.belly_diameter - self.neck_diameter)/2 * self.shoulder_curve,
             self.total_height - self.neck_height - self.shoulder_height],  # 肩部
            [self.neck_diameter/2, self.total_height - self.neck_height],   # 颈部
            [self.mouth_diameter/2, self.total_height]                # 口部
        ]
        return np.array(points)
    
    def validate(self) -> bool:
        """参数合法性校验"""
        checks = [
            self.total_height > 0,
            self.belly_diameter > self.neck_diameter,
            self.belly_diameter > self.foot_diameter,
            0 <= self.shoulder_curve <= 1,
            self.belly_height < self.total_height - self.neck_height
        ]
        return all(checks)

# 多视角标注规范
MULTI_VIEW_SPEC = {
    "front": {"azimuth": 0, "elevation": 0, "description": "正视图"},
    "side": {"azimuth": 90, "elevation": 0, "description": "侧视图"},
    "oblique": {"azimuth": 45, "elevation": 15, "description": "斜视图"},
    "top": {"azimuth": 0, "elevation": 90, "description": "俯视图"},
    "bottom": {"azimuth": 0, "elevation": -90, "description": "仰视图"}
}
```

```sql
-- 3D打印与快速打样数据表（节选）
CREATE TABLE printing_paste (
  paste_id TEXT PRIMARY KEY,
  recipe_id TEXT,                     -- 关联釉料配方
  solid_content REAL,                 -- 固含量 (%)
  viscosity_pa_s REAL,                -- 黏度 (Pa·s)
  yield_stress_pa REAL,               -- 屈服应力 (Pa)
  thixotropy_index REAL,              -- 触变指数
  created_at TEXT,
  FOREIGN KEY(recipe_id) REFERENCES glaze_recipe(recipe_id)
);

CREATE TABLE printing_params (
  param_id TEXT PRIMARY KEY,
  paste_id TEXT,
  nozzle_diameter_mm REAL,            -- 喷嘴直径
  layer_height_mm REAL,               -- 层高
  print_speed_mm_s REAL,              -- 打印速度
  infill_percentage REAL,             -- 填充率
  retraction_mm REAL,
  FOREIGN KEY(paste_id) REFERENCES printing_paste(paste_id)
);

CREATE TABLE printing_result (
  result_id TEXT PRIMARY KEY,
  param_id TEXT,
  profile_id TEXT,                    -- 烧成制度
  -- 尺寸变化
  shrinkage_x REAL,                   -- X方向收缩率
  shrinkage_y REAL,
  shrinkage_z REAL,
  deformation_rate REAL,              -- 变形率
  -- 力学性能
  flexural_strength_mpa REAL,         -- 抗弯强度
  thermal_shock_cycles INT,           -- 热稳定性（冷热交换次数）
  -- 外观评价
  surface_quality_score REAL,         -- 表面质量评分 (1-5)
  image_uri TEXT,
  tested_at TEXT,
  FOREIGN KEY(param_id) REFERENCES printing_params(param_id),
  FOREIGN KEY(profile_id) REFERENCES firing_profile(profile_id)
);

-- 查询：各膏体配方的打印成功率与力学性能
SELECT 
  p.paste_id,
  p.solid_content,
  p.viscosity_pa_s,
  COUNT(r.result_id) AS total_prints,
  AVG(r.flexural_strength_mpa) AS avg_strength,
  AVG(r.shrinkage_z) AS avg_shrinkage,
  SUM(CASE WHEN r.surface_quality_score >= 4 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS success_rate
FROM printing_paste p
JOIN printing_params pp ON p.paste_id = pp.paste_id
JOIN printing_result r ON pp.param_id = r.param_id
GROUP BY p.paste_id
ORDER BY avg_strength DESC;
```

## 七、执行进度（对照任务书计划进度目标）
| 起止年月 | 任务书进度目标要求 | 2025年完成情况 |
| --- | --- | --- |
| 2025-01-01至2025-06-30 | 建立数据库初步框架，完成数据录入，覆盖基础釉色与工艺参数；初步完成造型生成算法，确定材质迁移与渲染方案 | 已完成：数据库框架/录入/质检上线；器型参数化模板与造型生成原型完成；确定SDXL+LoRA+ControlNet技术路线与渲染方案 |
| 2025-07-01至2025-12-31 | 数据库80%填充并支持多维分析；文生图关联系统≥80%；申请软著1项 | 已完成：填充80%，多维分析上线；关联系统完成度84%；软著已申报 |

## 八、存在的问题及改进措施（面向2026上半年）
### 1) 总体判断
项目整体推进顺利，核心技术架构已搭建完成，数字化设计全链路（数据采集→生成设计→效果渲染）已完成初步验证。但在成果产出的均衡性与应用转化的规模化方面仍需加强。

### 2) 存在的问题
#### （一）研发与应用的衔接尚处于过渡期
| 问题维度 | 具体表现 | 影响范围 |
| --- | --- | --- |
| 链路贯通但规模不足 | 数字化全链路（提示词→设计图→三维模型→打样）已跑通，但从"设计图"到"实物样品"的转化仍以小批次验证为主，尚未形成规模化生产效应 | 子课题五 |
| 应用验证广度有限 | 当前应用验证集中于酒瓶品类，尚未拓展至茶具、花器等其他青瓷产品线；企业端实际订单转化率有待提升 | 全链路 |
| 用户反馈闭环不完善 | 设计师/客户端的交互反馈机制尚在搭建中，生成结果的满意度评估与迭代优化流程需进一步固化 | 子课题二、四 |

#### （二）支撑性指标的同步稍显滞后
| 问题维度 | 具体表现 | 对标任务书 |
| --- | --- | --- |
| 理论总结滞后 | 相对于算法模型的快速迭代（LoRA 6版本、LCM加速等），理论层面的归纳总结与学术论文产出节奏偏慢，目前仅1篇论文投稿 | 全项目3篇 |
| 知识产权产出待加速 | 软著申报1项已完成、1项准备中，与全项目4项目标相比进度尚可，但需持续推进；发明专利布局尚未启动 | 全项目4项软著、2项发明专利 |
| 第三方检测验证不足 | 3D打印样品的力学性能（抗弯强度≥60MPa）与热稳定性（180~20°C冷热交换）尚未完成第三方权威检测，目前仅有内部初测数据 | 中期检查指标 |

#### （三）技术层面的局部优化空间
1. 数据采集一致性：釉面影像采集条件存在跨批次光照差异，影响纹理embedding稳定性与检索一致性
2. 术语多义性：部分术语存在跨语境多义（工艺术语/审美术语混用），对提示词槽位映射带来噪声
3. 组合推理稳定性：LoRA组合推理在极端提示词下仍偶发结构漂移（器型轮廓偏移）与釉面伪影

### 3) 改进措施（2026上半年重点）
#### （一）加速应用转化与规模验证
| 改进方向 | 具体措施 | 预期目标 |
| --- | --- | --- |
| 扩大打样规模 | 与浙江天丰陶瓷有限公司深化合作，建立"设计→打样→小批量试产"的快速响应机制；2026H1完成≥5批次规模化打样 | 形成可复制的产业化流程 |
| 拓展品类覆盖 | 在酒瓶基础上，扩展至茶具、花器等品类，验证系统泛化能力 | 覆盖≥3个品类 |
| 完善用户反馈闭环 | 建立设计师/客户端的在线评价与反馈收集机制，形成"生成→评价→优化→再生成"的迭代闭环 | 用户满意度≥85% |

#### （二）加快支撑性指标产出
| 改进方向 | 具体措施 | 预期目标 |
| --- | --- | --- |
| 论文产出 | 加快GAN釉面仿真、CLIP跨模态对齐等技术的理论总结，2026H1完成1篇论文发表/录用 | 累计1篇发表 |
| 软著申报 | 完成第2项软著（釉面仿真与配方优化系统）正式申报；启动第3项软著（材质迁移系统）准备 | 累计2项申报 |
| 第三方检测 | 委托第三方权威机构（如国家陶瓷质量检测中心）对3D打印样品进行抗弯强度与热稳定性检测，获取正式检测报告 | 完成≥1份检测报告 |

#### （三）技术层面持续优化
1. 数据采集标准化：建立采集标准与色卡校准流程，加入光照归一与色域校正（白平衡/灰卡/ICC Profile），提升跨批次一致性
2. 术语规范化：术语词表引入"领域-语境"标签与规则约束，结合少量人工审核形成闭环修订机制
3. 模型稳定性提升：扩充ControlNet约束与回归测试集，固定关键器型的结构一致性阈值（>95%），优化负向提示词与CFG策略