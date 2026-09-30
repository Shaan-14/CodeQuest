/**
 * TEST-ONLY DATA (never imported by the app): reference solutions and plausible wrong attempts for the R challenges.
 * No imports (the e2e runner loads it under plain Node); R code is written with String.raw so backslashes stay as typed.
 * Every `valid` must pass and every `wrong` must fail.
 */
const r = String.raw;
export const solutionsR: Record<string, { valid: string[]; wrong: string[] }> = {
  'r-01-speed': {
    valid: [r`v <- as.numeric(readLines("trip.txt"))
print(v[1] / v[2])`, r`distance <- as.numeric(readLines("trip.txt", n = 1))
hours <- as.numeric(readLines("trip.txt"))[2]
speed <- distance / hours
print(speed)`],
    wrong: [r`v <- as.numeric(readLines("trip.txt"))
print(v[2] / v[1])`, r`v <- as.numeric(readLines("trip.txt"))
cat(v[1] / v[2])`, r`print(60)`, r`v <- as.numeric(readLines("trip.txt"))
print(round(v[1] / v[2]))`, r`v <- as.numeric(readLines("trip.txt"))
print(v[1] * v[2])`],
  },
  'r-01-fahrenheit': {
    valid: [r`c <- as.numeric(readLines("temp.txt"))
print(round(c * 9 / 5 + 32, 1))`, r`celsius <- as.numeric(readLines("temp.txt"))
f <- celsius * 1.8 + 32
print(round(f, digits = 1))`],
    wrong: [r`c <- as.numeric(readLines("temp.txt"))
print(round(c * 9 / 5 + 23, 1))`, r`c <- as.numeric(readLines("temp.txt"))
cat(round(c * 9 / 5 + 32, 1))`, r`c <- as.numeric(readLines("temp.txt"))
print(round(c * 9 / 5 + 32))`, r`print(98.6)`, r`c <- as.numeric(readLines("temp.txt"))
print(round((c + 32) * 9 / 5, 1))`],
  },
  'r-01-pounds': {
    valid: [r`kg <- as.numeric(readLines("weight.txt"))
print(round(kg * 2.20462, 1))`, r`w <- as.numeric(readLines("weight.txt"))
lb <- w * 2.20462
print(round(lb, 1))`],
    wrong: [r`kg <- as.numeric(readLines("weight.txt"))
print(round(kg * 2.2, 1))`, r`kg <- as.numeric(readLines("weight.txt"))
print(round(kg * 2.20462))`, r`kg <- as.numeric(readLines("weight.txt"))
print(kg * 2.20462)`, r`kg <- as.numeric(readLines("weight.txt"))
print(round(kg / 2.20462, 1))`],
  },
  'r-02-above-mean': {
    valid: [r`x <- as.numeric(readLines("readings.txt"))
print(sum(x > mean(x)))`, r`x <- as.numeric(readLines("readings.txt"))
m <- mean(x)
count <- 0
for (v in x) if (v > m) count <- count + 1
print(count)`, r`x <- as.numeric(readLines("readings.txt"))
print(length(x[x > mean(x)]))`],
    wrong: [r`x <- as.numeric(readLines("readings.txt"))
print(sum(x >= mean(x)))`, r`x <- as.numeric(readLines("readings.txt"))
print(sum(x > median(x)))`, r`x <- as.numeric(readLines("readings.txt"))
cat(sum(x > mean(x)))`, r`x <- as.numeric(readLines("readings.txt"))
print(mean(x))`, r`print(2)`],
  },
  'r-02-big-sales': {
    valid: [r`x <- as.numeric(readLines("sales.txt"))
print(sum(x[x >= 100]))`, r`x <- as.numeric(readLines("sales.txt"))
print(sum(ifelse(x >= 100, x, 0)))`],
    wrong: [r`x <- as.numeric(readLines("sales.txt"))
print(sum(x[x > 100]))`, r`x <- as.numeric(readLines("sales.txt"))
print(sum(x))`, r`x <- as.numeric(readLines("sales.txt"))
print(length(x[x >= 100]))`, r`x <- as.numeric(readLines("sales.txt"))
print(max(x[x >= 100]))`, r`print(250)`],
  },
  'r-02-best-below-limit': {
    valid: [r`x <- as.numeric(readLines("loads.txt"))
print(max(x[x < 100]))`, r`x <- as.numeric(readLines("loads.txt"))
safe <- x[x < 100]
print(sort(safe, decreasing = TRUE)[1])`],
    wrong: [r`x <- as.numeric(readLines("loads.txt"))
print(max(x[x <= 100]))`, r`x <- as.numeric(readLines("loads.txt"))
print(max(x))`, r`x <- as.numeric(readLines("loads.txt"))
print(min(x[x < 100]))`, r`x <- as.numeric(readLines("loads.txt"))
print(x[x < 100][1])`, r`print(99)`],
  },
  'r-03-letter': {
    valid: [r`letter_grade <- function(score) {
  if (score >= 90) "A" else if (score >= 80) "B" else if (score >= 70) "C" else "F"
}`, r`letter_grade <- function(score) {
  if (score < 70) return("F")
  if (score < 80) return("C")
  if (score < 90) return("B")
  "A"
}`, r`letter_grade <- function(score) ifelse(score >= 90, "A", ifelse(score >= 80, "B", ifelse(score >= 70, "C", "F")))`],
    wrong: [r`letter_grade <- function(score) {
  if (score > 90) "A" else if (score > 80) "B" else if (score > 70) "C" else "F"
}`, r`letter_grade <- function(score) {
  if (score >= 70) "C" else if (score >= 80) "B" else if (score >= 90) "A" else "F"
}`, r`letter_grade <- function(score) {
  if (score >= 90) "A" else if (score >= 80) "B" else "C"
}`, r`letter_grade <- function(score) {
  if (score >= 90) "A" else if (score >= 80) "B" else if (score >= 70) "C"
}`],
  },
  'r-03-risk-class': {
    valid: [r`risk_class <- function(score) ifelse(score >= 70, "high", ifelse(score >= 40, "medium", "low"))`, r`risk_class <- function(score) as.character(cut(score, breaks = c(-Inf, 40, 70, Inf), labels = c("low", "medium", "high"), right = FALSE))`],
    wrong: [r`risk_class <- function(score) {
  if (score >= 70) "high" else if (score >= 40) "medium" else "low"
}`, r`risk_class <- function(score) ifelse(score > 70, "high", ifelse(score > 40, "medium", "low"))`, r`risk_class <- function(score) ifelse(score >= 70, "high", ifelse(score >= 40, "low", "medium"))`, r`risk_class <- function(score) ifelse(score >= 70, "high", "low")`],
  },
  'r-03-stock-status': {
    valid: [r`stock_status <- function(units) ifelse(units >= 10, "ok", ifelse(units >= 1, "low", "out"))`, r`stock_status <- function(units) {
  out <- rep("ok", length(units))
  out[units < 10] <- "low"
  out[units < 1] <- "out"
  out
}`],
    wrong: [r`stock_status <- function(units) {
  if (units >= 10) "ok" else if (units >= 1) "low" else "out"
}`, r`stock_status <- function(units) ifelse(units > 10, "ok", ifelse(units > 1, "low", "out"))`, r`stock_status <- function(units) ifelse(units >= 10, "ok", "low")`, r`stock_status <- function(units) ifelse(units >= 10, "ok", ifelse(units >= 1, "out", "low"))`],
  },
  'r-03-longest-run': {
    valid: [r`longest_streak <- function(results) if (length(results) == 0) 0 else max(rle(results)$lengths)`, r`longest_streak <- function(results) {
  best <- 0
  run <- 0
  prev <- NULL
  for (v in results) {
    if (!is.null(prev) && identical(v, prev)) run <- run + 1 else run <- 1
    if (run > best) best <- run
    prev <- v
  }
  best
}`],
    wrong: [r`longest_streak <- function(results) length(unique(results))`, r`longest_streak <- function(results) if (length(results) == 0) 0 else max(table(results))`, r`longest_streak <- function(results) max(rle(results)$lengths)`, r`longest_streak <- function(results) {
  best <- 0
  run <- 0
  for (v in results) {
    run <- run + 1
    if (run > best) best <- run
  }
  best
}`],
  },
  'r-03-dry-spell': {
    valid: [r`longest_dry_spell <- function(rain) {
  best <- 0
  run <- 0
  for (r in rain) {
    if (r == 0) {
      run <- run + 1
      if (run > best) best <- run
    } else run <- 0
  }
  best
}`, r`longest_dry_spell <- function(rain) {
  runs <- rle(rain == 0)
  max(c(0, runs$lengths[runs$values]))
}`],
    wrong: [r`longest_dry_spell <- function(rain) sum(rain == 0)`, r`longest_dry_spell <- function(rain) {
  best <- 0
  run <- 0
  for (r in rain) {
    if (r == 0) run <- run + 1
    if (run > best) best <- run
  }
  best
}`, r`longest_dry_spell <- function(rain) {
  runs <- rle(rain == 0)
  max(runs$lengths)
}`, r`longest_dry_spell <- function(rain) {
  best <- 0
  run <- 0
  for (r in rain) {
    if (r == 0) run <- run + 1 else run <- 0
  }
  run
}`],
  },
  'r-04-first-look': {
    valid: [r`d <- read.csv("staff.csv")
cat("Rows:", nrow(d), "\n")
cat("Mean salary:", round(mean(d$salary), 2), "\n")`, r`d <- read.csv("staff.csv")
cat(paste0("Rows: ", nrow(d), "\nMean salary: ", round(sum(d$salary) / length(d$salary), 2)))`],
    wrong: [r`d <- read.csv("staff.csv")
cat("Rows:", ncol(d), "\n")
cat("Mean salary:", round(mean(d$salary), 2), "\n")`, r`d <- read.csv("staff.csv")
cat("Rows:", nrow(d), "\n")
cat("Mean salary:", round(mean(d$salary)), "\n")`, r`d <- read.csv("staff.csv")
cat("Rows:", nrow(d), "\n")
cat("Mean salary:", sprintf("%.2f", mean(d$salary)), "\n")`, r`d <- read.csv("staff.csv")
cat("Rows:", nrow(d), "\n")
cat("Mean salary:", median(d$salary), "\n")`, r`cat("Rows: 6\nMean salary: 53500\n")`],
  },
  'r-04-ops-well-paid': {
    valid: [r`d <- read.csv("staff.csv")
cat(d$name[d$dept == "Ops" & d$salary > 50000], sep = "\n")`, r`d <- read.csv("staff.csv")
keep <- d[d$dept == "Ops" & d$salary > 50000, ]
for (n in keep$name) cat(n, "\n", sep = "")`],
    wrong: [r`d <- read.csv("staff.csv")
cat(d$name[d$dept == "Ops" & d$salary >= 50000], sep = "\n")`, r`d <- read.csv("staff.csv")
cat(d$name[d$dept == "Ops" | d$salary > 50000], sep = "\n")`, r`d <- read.csv("staff.csv")
cat(d$name[tolower(d$dept) == "ops" & d$salary > 50000], sep = "\n")`, r`d <- read.csv("staff.csv")
print(d$name[d$dept == "Ops" & d$salary > 50000])`, r`d <- read.csv("staff.csv")
cat(d$name[d$salary > 50000], sep = "\n")`, r`cat("Ben Reed")`],
  },
  'r-04-reorder': {
    valid: [r`d <- read.csv("products.csv")
cat(d$item[d$stock < d$reorder_level & d$stock > 0], sep = "\n")`, r`d <- read.csv("products.csv")
low <- subset(d, stock < reorder_level & stock > 0)
writeLines(low$item)`],
    wrong: [r`d <- read.csv("products.csv")
cat(d$item[d$stock <= d$reorder_level & d$stock > 0], sep = "\n")`, r`d <- read.csv("products.csv")
cat(d$item[d$stock < d$reorder_level], sep = "\n")`, r`d <- read.csv("products.csv")
cat(d$item[d$stock < 50 & d$stock > 0], sep = "\n")`, r`d <- read.csv("products.csv")
print(d$item[d$stock < d$reorder_level & d$stock > 0])`],
  },
  'r-05-dept-means': {
    valid: [r`dept_means <- function(df) {
  a <- aggregate(salary ~ dept, data = df, FUN = mean)
  names(a) <- c("dept", "mean_salary")
  a[order(a$dept), ]
}`, r`dept_means <- function(df) {
  m <- tapply(df$salary, df$dept, mean)
  data.frame(dept = names(m), mean_salary = as.numeric(m), stringsAsFactors = FALSE)
}`],
    wrong: [r`dept_means <- function(df) aggregate(salary ~ dept, data = df, FUN = mean)`, r`dept_means <- function(df) {
  a <- aggregate(salary ~ dept, data = df, FUN = median)
  names(a) <- c("dept", "mean_salary")
  a
}`, r`dept_means <- function(df) {
  a <- aggregate(salary ~ dept, data = df, FUN = sum)
  names(a) <- c("dept", "mean_salary")
  a
}`, r`dept_means <- function(df) {
  data.frame(dept = "all", mean_salary = mean(df$salary))
}`],
  },
  'r-05-region-totals': {
    valid: [r`region_totals <- function(sales) {
  a <- aggregate(amount ~ region, data = sales, FUN = sum)
  names(a) <- c("region", "total")
  a[order(-a$total, a$region), ]
}`, r`region_totals <- function(sales) {
  t <- tapply(sales$amount, sales$region, sum)
  out <- data.frame(region = names(t), total = as.numeric(t), stringsAsFactors = FALSE)
  out[order(-out$total, out$region), ]
}`],
    wrong: [r`region_totals <- function(sales) {
  a <- aggregate(amount ~ region, data = sales, FUN = sum)
  names(a) <- c("region", "total")
  a[order(a$total), ]
}`, r`region_totals <- function(sales) {
  a <- aggregate(amount ~ region, data = sales, FUN = mean)
  names(a) <- c("region", "total")
  a[order(-a$total, a$region), ]
}`, r`region_totals <- function(sales) {
  a <- aggregate(amount ~ region, data = sales, FUN = sum)
  a[order(-a$amount, a$region), ]
}`, r`region_totals <- function(sales) {
  a <- aggregate(amount ~ region, data = sales, FUN = length)
  names(a) <- c("region", "total")
  a[order(-a$total, a$region), ]
}`],
  },
  'r-05-defect-rate': {
    valid: [r`line_defect_rates <- function(runs) {
  u <- aggregate(units ~ line, data = runs, FUN = sum)
  d <- aggregate(defects ~ line, data = runs, FUN = sum)
  m <- merge(u, d, by = "line")
  out <- data.frame(line = m$line, rate = round(m$defects / m$units, 3), stringsAsFactors = FALSE)
  out[order(-out$rate, out$line), ]
}`, r`line_defect_rates <- function(runs) {
  lines <- sort(unique(runs$line))
  rate <- sapply(lines, function(l) round(sum(runs$defects[runs$line == l]) / sum(runs$units[runs$line == l]), 3))
  out <- data.frame(line = lines, rate = as.numeric(rate), stringsAsFactors = FALSE)
  out[order(-out$rate, out$line), ]
}`],
    wrong: [r`line_defect_rates <- function(runs) {
  runs$r <- runs$defects / runs$units
  a <- aggregate(r ~ line, data = runs, FUN = mean)
  names(a) <- c("line", "rate")
  a$rate <- round(a$rate, 3)
  a[order(-a$rate, a$line), ]
}`, r`line_defect_rates <- function(runs) {
  u <- aggregate(units ~ line, data = runs, FUN = sum)
  d <- aggregate(defects ~ line, data = runs, FUN = sum)
  m <- merge(u, d, by = "line")
  out <- data.frame(line = m$line, rate = m$defects / m$units, stringsAsFactors = FALSE)
  out[order(-out$rate, out$line), ]
}`, r`line_defect_rates <- function(runs) {
  u <- aggregate(units ~ line, data = runs, FUN = sum)
  d <- aggregate(defects ~ line, data = runs, FUN = sum)
  m <- merge(u, d, by = "line")
  out <- data.frame(line = m$line, rate = round(m$defects / m$units, 3), stringsAsFactors = FALSE)
  out[order(out$rate, out$line), ]
}`, r`line_defect_rates <- function(runs) {
  u <- aggregate(units ~ line, data = runs, FUN = sum)
  d <- aggregate(defects ~ line, data = runs, FUN = sum)
  m <- merge(u, d, by = "line")
  out <- data.frame(line = m$line, rate = round(m$defects / m$units, 2), stringsAsFactors = FALSE)
  out[order(-out$rate, out$line), ]
}`],
  },
  'r-05-with-manager': {
    valid: [r`with_manager <- function(emp, depts) {
  m <- merge(emp, depts, by = "dept", all.x = TRUE)
  out <- data.frame(name = m$name, dept_name = m$dept_name, manager = m$manager, stringsAsFactors = FALSE)
  out[order(out$name), ]
}`, r`with_manager <- function(emp, depts) {
  i <- match(emp$dept, depts$dept)
  out <- data.frame(name = emp$name, dept_name = depts$dept_name[i], manager = depts$manager[i], stringsAsFactors = FALSE)
  out[order(out$name), ]
}`],
    wrong: [r`with_manager <- function(emp, depts) {
  m <- merge(emp, depts, by = "dept")
  out <- data.frame(name = m$name, dept_name = m$dept_name, manager = m$manager, stringsAsFactors = FALSE)
  out[order(out$name), ]
}`, r`with_manager <- function(emp, depts) {
  m <- merge(emp, depts, by = "dept", all.x = TRUE)
  data.frame(name = m$name, dept_name = m$dept_name, manager = m$manager, stringsAsFactors = FALSE)
}`, r`with_manager <- function(emp, depts) {
  m <- merge(emp, depts, by = "dept", all.x = TRUE)
  out <- data.frame(name = m$name, manager = m$manager, dept_name = m$dept_name, stringsAsFactors = FALSE)
  out[order(out$name), ]
}`, r`with_manager <- function(emp, depts) {
  m <- merge(emp, depts, by = "dept", all = TRUE)
  out <- data.frame(name = m$name, dept_name = m$dept_name, manager = m$manager, stringsAsFactors = FALSE)
  out[order(out$name), ]
}`],
  },
  'r-05-with-price': {
    valid: [r`priced_orders <- function(orders, prices) {
  m <- merge(orders, prices, by = "item", all.x = TRUE)
  m$total <- m$qty * m$price
  out <- data.frame(order_id = m$order_id, item = m$item, total = m$total, stringsAsFactors = FALSE)
  out[order(out$order_id), ]
}`, r`priced_orders <- function(orders, prices) {
  price <- prices$price[match(orders$item, prices$item)]
  out <- data.frame(order_id = orders$order_id, item = orders$item, total = orders$qty * price, stringsAsFactors = FALSE)
  out[order(out$order_id), ]
}`],
    wrong: [r`priced_orders <- function(orders, prices) {
  m <- merge(orders, prices, by = "item")
  m$total <- m$qty * m$price
  out <- data.frame(order_id = m$order_id, item = m$item, total = m$total, stringsAsFactors = FALSE)
  out[order(out$order_id), ]
}`, r`priced_orders <- function(orders, prices) {
  m <- merge(orders, prices, by = "item", all.x = TRUE)
  out <- data.frame(order_id = m$order_id, item = m$item, total = m$price, stringsAsFactors = FALSE)
  out[order(out$order_id), ]
}`, r`priced_orders <- function(orders, prices) {
  m <- merge(orders, prices, by = "item", all.x = TRUE)
  m$total <- m$qty * m$price
  data.frame(order_id = m$order_id, item = m$item, total = m$total, stringsAsFactors = FALSE)
}`, r`priced_orders <- function(orders, prices) {
  m <- merge(orders, prices, by = "item", all.x = TRUE)
  m$total <- ifelse(is.na(m$price), 0, m$qty * m$price)
  out <- data.frame(order_id = m$order_id, item = m$item, total = m$total, stringsAsFactors = FALSE)
  out[order(out$order_id), ]
}`],
  },
  'r-06-group-stats': {
    valid: [r`d <- read.csv("scores.csv")
for (g in sort(unique(d$group))) {
  v <- d$score[d$group == g]
  cat(sprintf("%s: n=%d, mean=%.2f, sd=%.2f\n", g, length(v), mean(v), sd(v)))
}`, r`d <- read.csv("scores.csv")
n <- tapply(d$score, d$group, length)
m <- tapply(d$score, d$group, mean)
s <- tapply(d$score, d$group, sd)
for (g in names(n)) cat(sprintf("%s: n=%d, mean=%.2f, sd=%.2f", g, n[[g]], m[[g]], s[[g]]), "\n", sep = "")`],
    wrong: [r`d <- read.csv("scores.csv")
for (g in sort(unique(d$group))) {
  v <- d$score[d$group == g]
  cat(sprintf("%s: n=%d, mean=%.2f, sd=%.2f\n", g, length(v), mean(v), sqrt(mean((v - mean(v))^2))))
}`, r`d <- read.csv("scores.csv")
for (g in unique(d$group)) {
  v <- d$score[d$group == g]
  cat(sprintf("%s: n=%d, mean=%.2f, sd=%.2f\n", g, length(v), mean(v), sd(v)))
}`, r`d <- read.csv("scores.csv")
for (g in sort(unique(d$group))) {
  v <- d$score[d$group == g]
  cat(sprintf("%s: n=%d, mean=%.1f, sd=%.1f\n", g, length(v), mean(v), sd(v)))
}`, r`d <- read.csv("scores.csv")
for (g in sort(unique(d$group))) {
  v <- d$score[d$group == g]
  cat(sprintf("%s: n=%d, mean=%.2f, sd=%.2f\n", g, length(v), median(v), sd(v)))
}`],
  },
  'r-06-trial': {
    valid: [r`d <- read.csv("trial.csv")
xs <- c()
ns <- c()
for (v in sort(unique(d$variant))) {
  g <- d$converted[d$variant == v]
  xs <- c(xs, sum(g))
  ns <- c(ns, length(g))
  cat(sprintf("%s: %d users, %.1f%% converted\n", v, length(g), 100 * mean(g)))
}
p <- prop.test(xs, ns)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (p < 0.05) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`, r`d <- read.csv("trial.csv")
tab <- table(d$variant, d$converted)
for (v in rownames(tab)) {
  n <- sum(tab[v, ])
  cat(sprintf("%s: %d users, %.1f%% converted\n", v, n, 100 * tab[v, "1"] / n))
}
p <- chisq.test(tab)$p.value
cat(sprintf("p-value: %.4f\n", p))
if (p < 0.05) cat("Verdict: significant difference\n") else cat("Verdict: no significant difference\n")`],
    wrong: [r`d <- read.csv("trial.csv")
xs <- c()
ns <- c()
for (v in sort(unique(d$variant))) {
  g <- d$converted[d$variant == v]
  xs <- c(xs, sum(g))
  ns <- c(ns, length(g))
  cat(sprintf("%s: %d users, %.1f%% converted\n", v, length(g), 100 * mean(g)))
}
p <- prop.test(xs, ns, correct = FALSE)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (p < 0.05) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`, r`d <- read.csv("trial.csv")
xs <- c()
ns <- c()
for (v in sort(unique(d$variant))) {
  g <- d$converted[d$variant == v]
  xs <- c(xs, sum(g))
  ns <- c(ns, length(g))
  cat(sprintf("%s: %d users, %.1f%% converted\n", v, length(g), 100 * mean(g)))
}
p <- prop.test(xs, ns)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (p < 0.01) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`, r`d <- read.csv("trial.csv")
xs <- c()
ns <- c()
for (v in sort(unique(d$variant))) {
  g <- d$converted[d$variant == v]
  xs <- c(xs, sum(g))
  ns <- c(ns, length(g))
  cat(sprintf("%s: %d users, %.1f%% converted\n", v, length(g), 100 * mean(g)))
}
p <- prop.test(xs, ns)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (xs[2] / ns[2] > xs[1] / ns[1]) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`, r`d <- read.csv("trial.csv")
xs <- c()
ns <- c()
for (v in sort(unique(d$variant))) {
  g <- d$converted[d$variant == v]
  xs <- c(xs, sum(g))
  ns <- c(ns, length(g))
  cat(sprintf("%s: %d users, %.1f%% converted\n", v, length(g), 100 * mean(g)))
}
p <- t.test(d$converted ~ d$variant)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (p < 0.05) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`],
  },
  'r-06-timings': {
    valid: [r`d <- read.csv("timings.csv")
for (m in sort(unique(d$machine))) {
  v <- d$seconds[d$machine == m]
  cat(sprintf("%s: n=%d, mean %.2f s\n", m, length(v), mean(v)))
}
p <- t.test(seconds ~ machine, data = d)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (p < 0.05) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`, r`d <- read.csv("timings.csv")
a <- d$seconds[d$machine == "M1"]
b <- d$seconds[d$machine == "M2"]
cat(sprintf("M1: n=%d, mean %.2f s\n", length(a), mean(a)))
cat(sprintf("M2: n=%d, mean %.2f s\n", length(b), mean(b)))
p <- t.test(a, b)$p.value
cat(sprintf("p-value: %.4f\n", p))
if (p < 0.05) cat("Verdict: significant difference\n") else cat("Verdict: no significant difference\n")`],
    wrong: [r`d <- read.csv("timings.csv")
for (m in sort(unique(d$machine))) {
  v <- d$seconds[d$machine == m]
  cat(sprintf("%s: n=%d, mean %.2f s\n", m, length(v), mean(v)))
}
p <- t.test(seconds ~ machine, data = d, var.equal = TRUE)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (p < 0.05) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`, r`d <- read.csv("timings.csv")
for (m in sort(unique(d$machine))) {
  v <- d$seconds[d$machine == m]
  cat(sprintf("%s: n=%d, mean %.2f s\n", m, length(v), mean(v)))
}
p <- wilcox.test(seconds ~ machine, data = d, exact = FALSE)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (p < 0.05) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`, r`d <- read.csv("timings.csv")
for (m in sort(unique(d$machine))) {
  v <- d$seconds[d$machine == m]
  cat(sprintf("%s: n=%d, mean %.2f s\n", m, length(v), mean(v)))
}
p <- t.test(seconds ~ machine, data = d)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (p < 0.1) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`, r`d <- read.csv("timings.csv")
for (m in sort(unique(d$machine))) {
  v <- d$seconds[d$machine == m]
  cat(sprintf("%s: n=%d, mean %.1f s\n", m, length(v), mean(v)))
}
p <- t.test(seconds ~ machine, data = d)$p.value
cat(sprintf("p-value: %.4f\n", p))
cat(if (p < 0.05) "Verdict: significant difference\n" else "Verdict: no significant difference\n")`],
  },
  'r-06-ad-spend': {
    valid: [r`d <- read.csv("ads.csv")
r <- cor(d$spend, d$sales)
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$sales ~ d$spend))[2]))`, r`d <- read.csv("ads.csv")
r <- cov(d$spend, d$sales) / (sd(d$spend) * sd(d$sales))
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$sales ~ d$spend))[2]))`],
    wrong: [r`d <- read.csv("ads.csv")
r <- cor(d$spend, d$sales)
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$sales ~ d$spend))[1]))`, r`d <- read.csv("ads.csv")
r <- cor(d$spend, d$sales)
a <- r
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$sales ~ d$spend))[2]))`, r`d <- read.csv("ads.csv")
r <- cor(d$spend, d$sales)
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.2f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$sales ~ d$spend))[2]))`, r`d <- read.csv("ads.csv")
r <- cor(d$spend, d$sales, method = "spearman")
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r >= 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$sales ~ d$spend))[2]))`, r`d <- read.csv("ads.csv")
r <- cor(d$spend, d$sales)
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.5) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$sales ~ d$spend))[2]))`, r`d <- read.csv("ads.csv")
r <- cor(d$spend, d$sales)^2
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$sales ~ d$spend))[2]))`],
  },
  'r-06-temp-energy': {
    valid: [r`d <- read.csv("energy.csv")
r <- cor(d$temp, d$kwh)
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$kwh ~ d$temp))[2]))`, r`d <- read.csv("energy.csv")
r <- cov(d$temp, d$kwh) / (sd(d$temp) * sd(d$kwh))
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$kwh ~ d$temp))[2]))`],
    wrong: [r`d <- read.csv("energy.csv")
r <- cor(d$temp, d$kwh)
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$kwh ~ d$temp))[1]))`, r`d <- read.csv("energy.csv")
r <- cor(d$temp, d$kwh)
a <- r
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$kwh ~ d$temp))[2]))`, r`d <- read.csv("energy.csv")
r <- cor(d$temp, d$kwh)
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.2f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$kwh ~ d$temp))[2]))`, r`d <- read.csv("energy.csv")
r <- cor(d$temp, d$kwh, method = "spearman")
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r >= 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$kwh ~ d$temp))[2]))`, r`d <- read.csv("energy.csv")
r <- cor(d$temp, d$kwh)
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.5) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$kwh ~ d$temp))[2]))`, r`d <- read.csv("energy.csv")
r <- cor(d$temp, d$kwh)^2
a <- abs(r)
strength <- if (a < 0.3) "weak" else if (a < 0.7) "moderate" else "strong"
direction <- if (r > 0) "positive" else "negative"
cat(sprintf("Correlation: %.3f\n", r))
cat(sprintf("Strength: %s %s\n", strength, direction))
cat(sprintf("Slope: %.2f\n", coef(lm(d$kwh ~ d$temp))[2]))`],
  },
  'r-01-label': {
    valid: [r`x <- readLines("item.txt")
cat(x[1], "costs", x[2], "\n")`, r`x <- readLines("item.txt")
cat(paste(x[1], "costs", x[2]))`],
    wrong: [r`x <- readLines("item.txt")
cat(x[1], x[2], "\n")`, r`x <- readLines("item.txt")
print(paste(x[1], "costs", x[2]))`, r`x <- readLines("item.txt")
cat(x[1], "costs", as.numeric(x[2]) * 2, "\n")`, r`cat("Bolt costs 2.5")`, r`x <- readLines("item.txt")
cat(paste0(x[1], "costs", x[2]))`],
  },
  'r-01-status-line': {
    valid: [r`x <- readLines("server.txt")
cat(paste0(x[1], ": ", x[2], "% load"), "\n")`, r`x <- readLines("server.txt")
cat(x[1], ": ", x[2], "% load\n", sep = "")`],
    wrong: [r`x <- readLines("server.txt")
cat(x[1], ":", x[2], "% load", "\n")`, r`x <- readLines("server.txt")
cat(paste0(x[1], ": ", x[2], " load"), "\n")`, r`x <- readLines("server.txt")
print(paste0(x[1], ": ", x[2], "% load"))`, r`x <- readLines("server.txt")
cat(paste0(x[1], ": ", as.numeric(x[2]) / 100, "% load"), "\n")`, r`cat("web1: 73% load")`],
  },
  'r-03-with-tax': {
    valid: [r`with_tax <- function(price, rate = 0.2) round(price * (1 + rate), 2)`, r`with_tax <- function(price, rate = 0.2) {
  total <- price + price * rate
  round(total, 2)
}`],
    wrong: [r`with_tax <- function(price, rate) round(price * (1 + rate), 2)`, r`with_tax <- function(price, rate = 0.2) price * (1 + rate)`, r`with_tax <- function(price, rate = 0.2) round(price * rate, 2)`, r`with_tax <- function(price, rate = 20) round(price * (1 + rate), 2)`, r`with_tax <- function(price, rate = 0.2) round(price * (1 + rate), 1)`],
  },
  'r-03-discounted': {
    valid: [r`sale_price <- function(price, off = 10) round(price * (1 - off / 100), 2)`, r`sale_price <- function(price, off = 10) round(price - price * off / 100, 2)`],
    wrong: [r`sale_price <- function(price, off) round(price * (1 - off / 100), 2)`, r`sale_price <- function(price, off = 10) round(price * (1 - off), 2)`, r`sale_price <- function(price, off = 10) round(price * off / 100, 2)`, r`sale_price <- function(price, off = 0.1) round(price * (1 - off / 100), 2)`, r`sale_price <- function(price, off = 10) price * (1 - off / 100)`],
  },
  'r-04-top-earner': {
    valid: [r`d <- read.csv("staff.csv")
i <- which.max(d$salary)
cat("Top: ", d$name[i], " (", d$salary[i], ")\n", sep = "")`, r`d <- read.csv("staff.csv")
top <- d[which(d$salary == max(d$salary))[1], ]
cat(sprintf("Top: %s (%s)\n", top$name, top$salary))`],
    wrong: [r`d <- read.csv("staff.csv")
i <- which.min(d$salary)
cat("Top: ", d$name[i], " (", d$salary[i], ")\n", sep = "")`, r`d <- read.csv("staff.csv")
i <- tail(which(d$salary == max(d$salary)), 1)
cat("Top: ", d$name[i], " (", d$salary[i], ")\n", sep = "")`, r`d <- read.csv("staff.csv")
i <- which.max(d$salary)
cat("Top:", d$name[i], d$salary[i], "\n")`, r`cat("Top: Caz Dunn (72000)\n")`, r`d <- read.csv("staff.csv")
i <- order(d$salary, decreasing = TRUE)[1]
cat("Top: ", d$name[i], " (", max(d$salary) - 1, ")\n", sep = "")`],
  },
  'r-04-longest-trip': {
    valid: [r`d <- read.csv("trips.csv")
i <- which.max(d$km)
cat("Longest: ", d$driver[i], " (", d$km[i], " km)\n", sep = "")`, r`d <- read.csv("trips.csv")
best <- d[order(-d$km, seq_len(nrow(d)))[1], ]
cat(sprintf("Longest: %s (%s km)\n", best$driver, best$km))`],
    wrong: [r`d <- read.csv("trips.csv")
i <- which.min(d$km)
cat("Longest: ", d$driver[i], " (", d$km[i], " km)\n", sep = "")`, r`d <- read.csv("trips.csv")
i <- tail(which(d$km == max(d$km)), 1)
cat("Longest: ", d$driver[i], " (", d$km[i], " km)\n", sep = "")`, r`d <- read.csv("trips.csv")
i <- which.max(d$km)
cat("Longest: ", d$driver[i], " (", d$km[i], ")\n", sep = "")`, r`d <- read.csv("trips.csv")
i <- which.max(d$km)
cat("Longest: ", d$route[i], " (", d$km[i], " km)\n", sep = "")`],
  },
  'r-04-payroll': {
    valid: [r`d <- read.csv("timesheet.csv")
pay <- ifelse(d$hours > 40, 40 * d$rate + (d$hours - 40) * d$rate * 1.5, d$hours * d$rate)
cat("Total payroll:", round(sum(pay), 2), "\n")`, r`d <- read.csv("timesheet.csv")
regular <- pmin(d$hours, 40)
overtime <- pmax(d$hours - 40, 0)
cat("Total payroll:", round(sum(regular * d$rate + overtime * d$rate * 1.5), 2), "\n")`],
    wrong: [r`d <- read.csv("timesheet.csv")
cat("Total payroll:", round(sum(d$hours * d$rate), 2), "\n")`, r`d <- read.csv("timesheet.csv")
pay <- ifelse(d$hours >= 40, 40 * d$rate + (d$hours - 40) * d$rate * 1.5, d$hours * d$rate)
cat("Total payroll:", round(sum(pay) + 1, 2), "\n")`, r`d <- read.csv("timesheet.csv")
pay <- ifelse(d$hours > 40, d$hours * d$rate * 1.5, d$hours * d$rate)
cat("Total payroll:", round(sum(pay), 2), "\n")`, r`d <- read.csv("timesheet.csv")
pay <- ifelse(d$hours > 40, 40 * d$rate + (d$hours - 40) * d$rate * 2, d$hours * d$rate)
cat("Total payroll:", round(sum(pay), 2), "\n")`, r`d <- read.csv("timesheet.csv")
pay <- ifelse(d$hours > 40, 40 * d$rate + (d$hours - 40) * d$rate * 1.5, d$hours * d$rate)
cat("Total payroll:", round(mean(pay), 2), "\n")`],
  },
  'r-04-fuel-cost': {
    valid: [r`d <- read.csv("deliveries.csv")
cost <- d$litres * 1.8 + ifelse(d$km > 100, 20, 0)
cat("Total fuel cost:", round(sum(cost), 2), "\n")`, r`d <- read.csv("deliveries.csv")
total <- sum(d$litres) * 1.8 + 20 * sum(d$km > 100)
cat("Total fuel cost:", round(total, 2), "\n")`],
    wrong: [r`d <- read.csv("deliveries.csv")
cat("Total fuel cost:", round(sum(d$litres) * 1.8, 2), "\n")`, r`d <- read.csv("deliveries.csv")
cost <- d$litres * 1.8 + ifelse(d$km >= 100, 20, 0)
cat("Total fuel cost:", round(sum(cost), 2), "\n")`, r`d <- read.csv("deliveries.csv")
cost <- d$litres * 1.8 + 20
cat("Total fuel cost:", round(sum(cost), 2), "\n")`, r`d <- read.csv("deliveries.csv")
cost <- d$km * 1.8 + ifelse(d$km > 100, 20, 0)
cat("Total fuel cost:", round(sum(cost), 2), "\n")`],
  },
  'r-05-top-paid': {
    valid: [r`top_paid <- function(df, n) head(df[order(-df$salary, df$name), ], n)`, r`top_paid <- function(df, n) {
  ordered <- df[order(df$salary, decreasing = TRUE), ]
  ordered <- ordered[order(-ordered$salary, ordered$name), ]
  ordered[seq_len(min(n, nrow(ordered))), ]
}`],
    wrong: [r`top_paid <- function(df, n) head(df[order(df$salary), ], n)`, r`top_paid <- function(df, n) head(df[order(-df$salary), ], n)`, r`top_paid <- function(df, n) df[order(-df$salary, df$name), ][1:n, ]`, r`top_paid <- function(df, n) head(df[order(-df$salary, df$name), "name"], n)`, r`top_paid <- function(df, n) head(df[order(-df$salary, df$name), ], n + 1)`],
  },
  'r-05-slowest-runs': {
    valid: [r`slowest_runs <- function(runs, n) head(runs[order(-runs$seconds, runs$test), ], n)`, r`slowest_runs <- function(runs, n) {
  o <- runs[order(runs$test), ]
  o <- o[order(o$seconds, decreasing = TRUE), ]
  head(o, n)
}`],
    wrong: [r`slowest_runs <- function(runs, n) head(runs[order(runs$seconds), ], n)`, r`slowest_runs <- function(runs, n) head(runs[order(-runs$seconds), ], n)`, r`slowest_runs <- function(runs, n) runs[order(-runs$seconds, runs$test), ][1:n, ]`, r`slowest_runs <- function(runs, n) head(runs[order(-runs$seconds, runs$test), c("test", "seconds")], n)`],
  },
};
