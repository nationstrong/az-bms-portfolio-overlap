# AstraZeneca + BMS portfolio collision chart
# Reproducible R / ggplot2 version with stacked company footprint bars
# Required packages: ggplot2, dplyr, tidyr, patchwork, scales, grid

library(ggplot2)
library(dplyr)
library(tidyr)
library(patchwork)
library(scales)
library(grid)

infile <- "AZ_BMS_Portfolio_Collision_Lollipop_Logo_Colors_v2_Plot_Data.csv"
out_png <- "AZ_BMS_Portfolio_Collision_Lollipop_Logo_Colors_v2_R.png"
out_pdf <- "AZ_BMS_Portfolio_Collision_Lollipop_Logo_Colors_v2_R.pdf"

d <- read.csv(infile, check.names = FALSE)

area_order <- c(
  "Solid-tumor oncology", "Hematology", "Immunology, respiratory & fibrosis",
  "Cardiovascular", "Rare disease", "Renal & metabolic", "Infectious disease", "Neuroscience"
)
factor_order <- c("Shared indications", "Shared modalities", "Shared target / mechanism", "Stage alignment")
area_labels <- c(
  "Solid-tumor oncology" = "Solid\ntumors",
  "Hematology" = "Hematology",
  "Immunology, respiratory & fibrosis" = "Immunology /\nresp. / fibrosis",
  "Cardiovascular" = "CV",
  "Rare disease" = "Rare\ndisease",
  "Renal & metabolic" = "Renal /\nmetabolic",
  "Infectious disease" = "Infectious\ndisease",
  "Neuroscience" = "Neuroscience"
)

# Logo-inspired company palette; red is reserved for overlap directness.
COL_AZ <- "#7A1F63"
COL_AZ_ACCENT <- "#D7A900"
COL_BMS <- "#263B73"
COL_BMS_ACCENT <- "#76519A"
COL_LIMITED <- "#F7D3D0"
COL_MODERATE <- "#ED756D"
COL_STRONG <- "#C51F36"
COL_RED_EDGE <- "#8E1829"
COL_INK <- "#182230"
COL_INK2 <- "#344054"
COL_GRID <- "#DED9D2"
COL_GRID_V <- "#EEEAE5"
COL_BG <- "#F4F1EC"
COL_CARD <- "#FFFFFF"
COL_TAKEAWAY <- "#17212D"

# Normalize factors and labels.
d <- d %>%
  mutate(
    disease_area = factor(disease_area, levels = area_order),
    factor = factor(factor, levels = rev(factor_order)),
    intensity_f = factor(intensity, levels = c(1, 2, 3), labels = c("Limited", "Moderate", "Strong")),
    label = ifelse(overlap_count > 0, overlap_count, ""),
    text_color = case_when(
      intensity >= 2 ~ "white",
      intensity == 1 ~ COL_RED_EDGE,
      TRUE ~ COL_INK
    )
  )

# One row per disease area for program footprint.
footprint <- d %>%
  distinct(disease_area, az_programs, bms_programs) %>%
  transmute(
    disease_area,
    AstraZeneca = az_programs,
    BMS = bms_programs,
    Total = az_programs + bms_programs
  )

foot_long <- footprint %>%
  pivot_longer(c(AstraZeneca, BMS), names_to = "company", values_to = "programs") %>%
  mutate(company = factor(company, levels = c("AstraZeneca", "BMS")))

# Stacked bars aligned with disease columns.
p_bar <- ggplot(foot_long, aes(x = disease_area, y = programs, fill = company)) +
  geom_col(width = 0.58) +
  geom_text(
    aes(label = ifelse(programs > 0, programs, "")),
    position = position_stack(vjust = 0.5),
    color = "white", fontface = "bold", size = 3.2
  ) +
  geom_text(
    data = footprint,
    aes(x = disease_area, y = Total + 0.6, label = Total),
    inherit.aes = FALSE, color = COL_INK, fontface = "bold", size = 3.6
  ) +
  scale_fill_manual(values = c("AstraZeneca" = COL_AZ, "BMS" = COL_BMS)) +
  scale_x_discrete(labels = area_labels, drop = FALSE) +
  scale_y_continuous(limits = c(0, 21), expand = expansion(mult = c(0, 0))) +
  labs(
    title = "LATE-STAGE PROGRAM FOOTPRINT",
    subtitle = "Unique lead Phase II or Phase III/pivotal/registration assets/programs",
    x = NULL, y = NULL, fill = NULL
  ) +
  theme_minimal(base_family = "sans") +
  theme(
    panel.grid = element_blank(),
    axis.text.y = element_blank(),
    axis.ticks = element_blank(),
    axis.text.x = element_text(face = "bold", size = 8.5, color = COL_INK, margin = margin(t = 8)),
    plot.title = element_text(size = 10, face = "bold", color = COL_INK2),
    plot.subtitle = element_text(size = 8.5, color = COL_INK2),
    legend.position = "top",
    legend.justification = "right",
    legend.text = element_text(size = 8, color = COL_INK2),
    plot.margin = margin(6, 18, 8, 18)
  )

# Vertical connector range for each disease area.
segments <- d %>%
  filter(overlap_count > 0) %>%
  mutate(y_num = as.numeric(factor)) %>%
  group_by(disease_area) %>%
  summarise(ymin = min(y_num), ymax = max(y_num), .groups = "drop")

p_matrix <- ggplot(d, aes(x = disease_area, y = factor)) +
  geom_hline(yintercept = seq_along(factor_order), color = COL_GRID, linewidth = 0.35) +
  geom_vline(xintercept = seq_along(area_order), color = COL_GRID_V, linewidth = 0.30) +
  geom_segment(
    data = segments,
    aes(x = disease_area, xend = disease_area, y = ymin, yend = ymax),
    inherit.aes = FALSE, color = "#4A5568", linewidth = 1.05, lineend = "round"
  ) +
  geom_point(
    data = d %>% filter(overlap_count == 0),
    shape = 21, size = 3.1, stroke = 0.8, fill = COL_CARD, color = "#BFC4CB"
  ) +
  geom_point(
    data = d %>% filter(overlap_count > 0),
    aes(size = overlap_count, fill = intensity_f),
    shape = 21, stroke = 0.9, color = COL_RED_EDGE
  ) +
  geom_text(
    data = d %>% filter(overlap_count > 0),
    aes(label = label, color = text_color),
    fontface = "bold", size = 3.0, show.legend = FALSE
  ) +
  scale_color_identity() +
  scale_size_continuous(
    name = "Bubble size = overlap count",
    breaks = c(1, 2, 4), range = c(6, 14)
  ) +
  scale_fill_manual(
    name = "Red tone = directness",
    values = c("Limited" = COL_LIMITED, "Moderate" = COL_MODERATE, "Strong" = COL_STRONG)
  ) +
  guides(
    size = guide_legend(order = 1, title.position = "top", nrow = 1),
    fill = guide_legend(order = 2, title.position = "top", nrow = 1, override.aes = list(size = 5))
  ) +
  labs(x = NULL, y = NULL) +
  theme_minimal(base_family = "sans") +
  theme(
    panel.grid = element_blank(),
    axis.text.x = element_blank(),
    axis.ticks = element_blank(),
    axis.text.y = element_text(size = 9.2, color = COL_INK, margin = margin(r = 12)),
    legend.position = "bottom",
    legend.box = "horizontal",
    legend.title = element_text(size = 8, face = "bold", color = COL_INK2),
    legend.text = element_text(size = 7.8, color = COL_INK2),
    plot.margin = margin(4, 18, 4, 18)
  )

p_note <- ggplot() +
  annotate("rect", xmin = 0, xmax = 1, ymin = 0, ymax = 1, fill = COL_TAKEAWAY) +
  annotate("text", x = 0.04, y = 0.78, hjust = 0,
           label = "WHAT THE CHART SAYS", color = "#F5CADC", fontface = "bold", size = 3.5) +
  annotate("text", x = 0.04, y = 0.53, hjust = 0,
           label = "Oncology has the deepest collision - but the overlap is not equally direct.",
           color = "white", fontface = "bold", size = 5.2) +
  annotate("text", x = 0.04, y = 0.22, hjust = 0,
           label = paste0(
             "Solid tumors share 2 indication territories, 4 modality classes and 2 target/mechanism themes.\n",
             "Hematology has one exact GPRC5D target overlap. Outside oncology, most overlap is platform or stage adjacency."
           ), color = "#E6E9ED", size = 3.3, lineheight = 1.35) +
  coord_cartesian(xlim = c(0, 1), ylim = c(0, 1), clip = "off") +
  theme_void()

final <- p_bar / p_matrix / p_note +
  plot_layout(heights = c(0.36, 0.50, 0.18)) +
  plot_annotation(
    title = "AstraZeneca + BMS: where does the portfolio really collide?",
    subtitle = paste0(
      "Top bars show each company's late-stage footprint. Bubble size and label show overlap count; ",
      "red tone shows directness."
    ),
    caption = paste0(
      "Count = distinct shared indication territories, modality classes, target/mechanism themes or stage bands - not all asset-pair permutations.\n",
      "Late-stage program = unique lead investigational asset in Phase II or Phase III/pivotal/registration; matched February 2026 company disclosures."
    ),
    theme = theme(
      plot.title = element_text(size = 24, face = "bold", color = COL_INK),
      plot.subtitle = element_text(size = 10.5, color = COL_INK2),
      plot.caption = element_text(size = 7, color = COL_INK2, hjust = 0),
      plot.background = element_rect(fill = COL_BG, color = NA),
      plot.margin = margin(16, 16, 12, 16)
    )
  ) & theme(plot.background = element_rect(fill = COL_CARD, color = NA))

ggsave(out_png, final, width = 10.8, height = 13.5, dpi = 300, bg = COL_BG)
ggsave(out_pdf, final, width = 10.8, height = 13.5, bg = COL_BG)
