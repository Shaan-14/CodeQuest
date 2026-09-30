/**
 * TEST-ONLY DATA (never imported by the app): reference programs and wrong attempts for the R boss problems.
 * No imports; R is written with String.raw so backslashes stay as typed.
 */
const r = String.raw;
export const bossRSolutions: Record<string, { valid: string[]; wrong: string[] }> = {
  'boss-r-mastery-a': {
    valid: [r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d <- d[!is.na(d$value), ]
d$lab <- trimws(d$lab)
med <- function(x) { n <- length(x); s <- sort(x); if (n %% 2 == 1) s[(n + 1) / 2] else (s[n / 2] + s[n / 2 + 1]) / 2 }
outl <- function(v) {
  if (length(v) < 4) return(0)
  s <- sort(v); n <- length(s)
  lo <- s[seq_len(n %/% 2)]
  hi <- s[seq(n %/% 2 + n %% 2 + 1, n)]
  q1 <- med(lo); q3 <- med(hi); i <- q3 - q1
  sum(v < q1 - 1.5 * i | v > q3 + 1.5 * i)
}
best <- NULL; bsd <- -1
for (l in sort(unique(d$lab))) {
  v <- d$value[d$lab == l]
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), outl(v)))
  if (length(v) >= 2) { s <- sd(v); if (s > bsd + 1e-12) { bsd <- s; best <- l } }
}
cat(sprintf("Noisiest: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d$lab <- trimws(d$lab)
d <- subset(d, !is.na(value))
q <- function(v) { s <- sort(v); n <- length(s); h <- n %/% 2; m <- function(x) if (length(x) %% 2) x[(length(x) + 1) / 2] else mean(x[length(x) / 2 + 0:1]); c(m(s[1:h]), m(s[(n - h + 1):n])) }
labs <- sort(unique(d$lab)); sds <- numeric(0)
for (l in labs) {
  v <- d$value[d$lab == l]; out <- 0
  if (length(v) >= 4) { k <- q(v); f <- 1.5 * (k[2] - k[1]); out <- sum(v < k[1] - f | v > k[2] + f) }
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), out))
  sds[l] <- if (length(v) >= 2) sd(v) else NA
}
ok <- names(sds)[!is.na(sds)]
cat("Noisiest:", if (length(ok)) ok[which.max(sds[ok])] else "none", "\n")`],
    wrong: [r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d$value[is.na(d$value)] <- 0
d$lab <- trimws(d$lab)
med <- function(x) { n <- length(x); s <- sort(x); if (n %% 2 == 1) s[(n + 1) / 2] else (s[n / 2] + s[n / 2 + 1]) / 2 }
outl <- function(v) {
  if (length(v) < 4) return(0)
  s <- sort(v); n <- length(s)
  lo <- s[seq_len(n %/% 2)]
  hi <- s[seq(n %/% 2 + n %% 2 + 1, n)]
  q1 <- med(lo); q3 <- med(hi); i <- q3 - q1
  sum(v < q1 - 1.5 * i | v > q3 + 1.5 * i)
}
best <- NULL; bsd <- -1
for (l in sort(unique(d$lab))) {
  v <- d$value[d$lab == l]
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), outl(v)))
  if (length(v) >= 2) { s <- sd(v); if (s > bsd + 1e-12) { bsd <- s; best <- l } }
}
cat(sprintf("Noisiest: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d <- d[!is.na(d$value), ]
d$lab <- d$lab
med <- function(x) { n <- length(x); s <- sort(x); if (n %% 2 == 1) s[(n + 1) / 2] else (s[n / 2] + s[n / 2 + 1]) / 2 }
outl <- function(v) {
  if (length(v) < 4) return(0)
  s <- sort(v); n <- length(s)
  lo <- s[seq_len(n %/% 2)]
  hi <- s[seq(n %/% 2 + n %% 2 + 1, n)]
  q1 <- med(lo); q3 <- med(hi); i <- q3 - q1
  sum(v < q1 - 1.5 * i | v > q3 + 1.5 * i)
}
best <- NULL; bsd <- -1
for (l in sort(unique(d$lab))) {
  v <- d$value[d$lab == l]
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), outl(v)))
  if (length(v) >= 2) { s <- sd(v); if (s > bsd + 1e-12) { bsd <- s; best <- l } }
}
cat(sprintf("Noisiest: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d <- d[!is.na(d$value), ]
d$lab <- trimws(d$lab)
med <- function(x) { n <- length(x); s <- sort(x); if (n %% 2 == 1) s[(n + 1) / 2] else (s[n / 2] + s[n / 2 + 1]) / 2 }
outl <- function(v) {
  if (length(v) < 4) return(0)
  s <- sort(v); n <- length(s)
  lo <- s[seq_len(n %/% 2)]
  hi <- s[seq(n %/% 2 + n %% 2 + 1, n)]
  q1 <- med(lo); q3 <- med(hi); i <- q3 - q1
  sum(v <= q1 - 1.5 * i | v >= q3 + 1.5 * i)
}
best <- NULL; bsd <- -1
for (l in sort(unique(d$lab))) {
  v <- d$value[d$lab == l]
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), outl(v)))
  if (length(v) >= 2) { s <- sd(v); if (s > bsd + 1e-12) { bsd <- s; best <- l } }
}
cat(sprintf("Noisiest: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d <- d[!is.na(d$value), ]
d$lab <- trimws(d$lab)
med <- function(x) { n <- length(x); s <- sort(x); if (n %% 2 == 1) s[(n + 1) / 2] else (s[n / 2] + s[n / 2 + 1]) / 2 }
outl <- function(v) {
  if (length(v) < 4) return(0)
  s <- sort(v); n <- length(s)
  lo <- s[seq_len(n %/% 2)]
  hi <- s[seq(n %/% 2 + n %% 2 + 1, n)]
  q1 <- quantile(v, 0.25, names = FALSE); q3 <- quantile(v, 0.75, names = FALSE); i <- q3 - q1
  sum(v < q1 - 1.5 * i | v > q3 + 1.5 * i)
}
best <- NULL; bsd <- -1
for (l in sort(unique(d$lab))) {
  v <- d$value[d$lab == l]
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), outl(v)))
  if (length(v) >= 2) { s <- sd(v); if (s > bsd + 1e-12) { bsd <- s; best <- l } }
}
cat(sprintf("Noisiest: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d <- d[!is.na(d$value), ]
d$lab <- trimws(d$lab)
med <- function(x) { n <- length(x); s <- sort(x); if (n %% 2 == 1) s[(n + 1) / 2] else (s[n / 2] + s[n / 2 + 1]) / 2 }
outl <- function(v) {
  if (length(v) < 4) return(0)
  s <- sort(v); n <- length(s)
  lo <- s[seq_len(n %/% 2)]
  hi <- s[seq(n %/% 2 + n %% 2 + 1, n)]
  q1 <- med(lo); q3 <- med(hi); i <- q3 - q1
  sum(v < q1 - 1.5 * i | v > q3 + 1.5 * i)
}
best <- NULL; bsd <- -1
for (l in sort(unique(d$lab))) {
  v <- d$value[d$lab == l]
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), outl(v)))
  if (length(v) >= 2) { s <- sqrt(mean((v - mean(v))^2)); if (s > bsd + 1e-12) { bsd <- s; best <- l } }
}
cat(sprintf("Noisiest: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d <- d[!is.na(d$value), ]
d$lab <- trimws(d$lab)
med <- function(x) { n <- length(x); s <- sort(x); if (n %% 2 == 1) s[(n + 1) / 2] else (s[n / 2] + s[n / 2 + 1]) / 2 }
outl <- function(v) {
  if (length(v) < 4) return(0)
  s <- sort(v); n <- length(s)
  lo <- s[seq_len(n %/% 2)]
  hi <- s[seq(n %/% 2 + n %% 2 + 1, n)]
  q1 <- med(lo); q3 <- med(hi); i <- q3 - q1
  sum(v < q1 - 1.5 * i | v > q3 + 1.5 * i)
}
best <- NULL; bsd <- -1
for (l in sort(unique(d$lab))) {
  v <- d$value[d$lab == l]
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), outl(v)))
  if (length(v) >= 2) { s <- sd(v); if (s >= bsd) { bsd <- s; best <- l } }
}
cat(sprintf("Noisiest: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d <- d[!is.na(d$value), ]
d$lab <- trimws(d$lab)
med <- function(x) { n <- length(x); s <- sort(x); if (n %% 2 == 1) s[(n + 1) / 2] else (s[n / 2] + s[n / 2 + 1]) / 2 }
outl <- function(v) {
  if (length(v) < 4) return(0)
  s <- sort(v); n <- length(s)
  lo <- s[seq_len(n %/% 2)]
  hi <- s[seq(n %/% 2 + n %% 2 + 1, n)]
  q1 <- med(lo); q3 <- med(hi); i <- q3 - q1
  sum(v < q1 - 1.5 * i | v > q3 + 1.5 * i)
}
best <- NULL; bsd <- -1
for (l in sort(unique(d$lab))) {
  v <- d$value[d$lab == l]
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), outl(v)))
  if (length(v) >= 1) { s <- sd(v); if (s > bsd + 1e-12) { bsd <- s; best <- l } }
}
cat(sprintf("Noisiest: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("assays.csv", stringsAsFactors = FALSE)
d <- d[!is.na(d$value), ]
d$lab <- trimws(d$lab)
med <- function(x) { n <- length(x); s <- sort(x); if (n %% 2 == 1) s[(n + 1) / 2] else (s[n / 2] + s[n / 2 + 1]) / 2 }
outl <- function(v) {
  if (length(v) < 4) return(0)
  s <- sort(v); n <- length(s)
  lo <- s[seq_len(n %/% 2)]
  hi <- s[seq(n %/% 2 + n %% 2 + 1, n)]
  q1 <- med(lo); q3 <- med(hi); i <- q3 - q1
  sum(v < q1 - 1.5 * i | v > q3 + 1.5 * i)
}
best <- NULL; bsd <- -1
for (l in sort(unique(d$lab))) {
  v <- d$value[d$lab == l]
  cat(sprintf("%s: n=%d, mean=%.2f, outliers=%d\n", l, length(v), mean(v), outl(v)))
  if (length(v) >= 2) { s <- sd(v); if (s > bsd + 1e-12) { bsd <- s; best <- l } }
}
cat(sprintf("Noisiest: %s\n", best))`],
  },
  'boss-r-mastery-b': {
    valid: [r`d <- read.csv("visits.csv", stringsAsFactors = FALSE)
d$clinic <- trimws(d$clinic)
best <- NULL; bm <- -Inf
for (c in sort(unique(d$clinic))) {
  x <- d[d$clinic == c, ]
  m <- if (all(is.na(x$minutes))) NA else median(x$minutes, na.rm = TRUE)
  ref <- mean(tolower(trimws(x$outcome)) == "referred") * 100
  cat(sprintf("%s: n=%d, median wait=%s, referred=%.1f%%\n", c, nrow(x), if (is.na(m)) "NA" else format(m), ref))
  if (!is.na(m) && m > bm + 1e-12) { bm <- m; best <- c }
}
cat(sprintf("Longest median: %s\n", if (is.null(best)) "none" else best))`],
    wrong: [r`d <- read.csv("visits.csv", stringsAsFactors = FALSE)
d$clinic <- trimws(d$clinic)
best <- NULL; bm <- -Inf
for (c in sort(unique(d$clinic))) {
  x <- d[d$clinic == c, ]
  m <- if (all(is.na(x$minutes))) NA else mean(x$minutes, na.rm = TRUE)
  ref <- mean(tolower(trimws(x$outcome)) == "referred") * 100
  cat(sprintf("%s: n=%d, median wait=%s, referred=%.1f%%\n", c, nrow(x), if (is.na(m)) "NA" else format(m), ref))
  if (!is.na(m) && m > bm + 1e-12) { bm <- m; best <- c }
}
cat(sprintf("Longest median: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("visits.csv", stringsAsFactors = FALSE)
d$clinic <- trimws(d$clinic)
best <- NULL; bm <- -Inf
for (c in sort(unique(d$clinic))) {
  x <- d[d$clinic == c, ]
  m <- if (all(is.na(x$minutes))) NA else median(x$minutes, na.rm = TRUE)
  ref <- mean(x$outcome == "referred") * 100
  cat(sprintf("%s: n=%d, median wait=%s, referred=%.1f%%\n", c, nrow(x), if (is.na(m)) "NA" else format(m), ref))
  if (!is.na(m) && m > bm + 1e-12) { bm <- m; best <- c }
}
cat(sprintf("Longest median: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("visits.csv", stringsAsFactors = FALSE)
d$clinic <- trimws(d$clinic)
best <- NULL; bm <- -Inf
for (c in sort(unique(d$clinic))) {
  x <- d[d$clinic == c, ]
  m <- if (all(is.na(x$minutes))) NA else median(x$minutes, na.rm = TRUE)
  ref <- mean(tolower(trimws(x$outcome)) == "referred") * 100
  cat(sprintf("%s: n=%d, median wait=%s, referred=%.1f%%\n", c, nrow(x), if (is.na(m)) "NA" else format(m), ref))
  if (!is.na(m) && m >= bm) { bm <- m; best <- c }
}
cat(sprintf("Longest median: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("visits.csv", stringsAsFactors = FALSE)
d$clinic <- trimws(d$clinic)
best <- NULL; bm <- -Inf
for (c in sort(unique(d$clinic))) {
  x <- d[d$clinic == c, ]
  m <- if (all(is.na(x$minutes))) NA else median(x$minutes, na.rm = TRUE)
  ref <- mean(tolower(trimws(x$outcome)) == "referred") * 100
  cat(sprintf("%s: n=%d, median wait=%s, referred=%.1f%%\n", c, sum(!is.na(x$minutes)), if (is.na(m)) "NA" else format(m), ref))
  if (!is.na(m) && m > bm + 1e-12) { bm <- m; best <- c }
}
cat(sprintf("Longest median: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("visits.csv", stringsAsFactors = FALSE)
d$clinic <- trimws(d$clinic)
best <- NULL; bm <- -Inf
for (c in sort(unique(d$clinic))) {
  x <- d[d$clinic == c, ]
  m <- if (all(is.na(x$minutes))) NA else median(x$minutes, na.rm = TRUE)
  ref <- mean(tolower(trimws(x$outcome)) == "referred") * 100
  cat(sprintf("%s: n=%d, median wait=%s, referred=%.0f%%\n", c, nrow(x), if (is.na(m)) "NA" else format(m), ref))
  if (!is.na(m) && m > bm + 1e-12) { bm <- m; best <- c }
}
cat(sprintf("Longest median: %s\n", if (is.null(best)) "none" else best))`, r`d <- read.csv("visits.csv", stringsAsFactors = FALSE)
d$clinic <- trimws(d$clinic)
best <- NULL; bm <- -Inf
for (c in sort(unique(d$clinic))) {
  x <- d[d$clinic == c, ]
  m <- if (all(is.na(x$minutes))) NA else median(x$minutes, na.rm = TRUE)
  ref <- mean(tolower(trimws(x$outcome)) == "referred") * 100
  cat(sprintf("%s: n=%d, median wait=%s, referred=%.1f%%\n", c, nrow(x), if (is.na(m)) "NA" else format(m), ref))
  if (!is.na(m) && m > bm + 1e-12) { bm <- m; best <- c }
}
cat(sprintf("Longest median: %s\n", c))`, r`d <- read.csv("visits.csv", stringsAsFactors = FALSE)
d$clinic <- trimws(d$clinic)
best <- NULL; bm <- -Inf
for (c in sort(unique(d$clinic))) {
  x <- d[d$clinic == c, ]
  m <- if (all(is.na(x$minutes))) NA else median(x$minutes)
  ref <- mean(tolower(trimws(x$outcome)) == "referred") * 100
  cat(sprintf("%s: n=%d, median wait=%s, referred=%.1f%%\n", c, nrow(x), if (is.na(m)) "NA" else format(m), ref))
  if (!is.na(m) && m > bm + 1e-12) { bm <- m; best <- c }
}
cat(sprintf("Longest median: %s\n", if (is.null(best)) "none" else best))`],
  },
  'boss-r-summit-a': {
    valid: [r`d <- read.csv("outages.csv", stringsAsFactors = FALSE)
for (p in sort(unique(d$plant))) {
  x <- d[d$plant == p, ]
  cat(sprintf("%s: %d outages, %.1f hours, cost %s\n", p, nrow(x), sum(x$hours), format(sum(x$cost, na.rm = TRUE))))
}
ok <- !is.na(d$cost)
cat(sprintf("Correlation (hours, cost): %s\n", if (sum(ok) < 3 || sd(d$hours[ok]) == 0 || sd(d$cost[ok]) == 0) "NA" else sprintf("%.3f", cor(d$hours[ok], d$cost[ok]))))
h <- as.integer(substr(d$start, 12, 13))
night <- h >= 22 | h < 6
if (sum(night) >= 2 && sum(!night) >= 2) {
  p <- t.test(d$hours[night], d$hours[!night])$p.value
  cat(sprintf("Night vs day: p-value %.4f -> %s\n", p, if (p < 0.05) "significant" else "not significant"))
} else cat("Night vs day: not enough data\n")`],
    wrong: [r`d <- read.csv("outages.csv", stringsAsFactors = FALSE)
for (p in sort(unique(d$plant))) {
  x <- d[d$plant == p, ]
  cat(sprintf("%s: %d outages, %.1f hours, cost %s\n", p, nrow(x), sum(x$hours), format(sum(x$cost, na.rm = TRUE))))
}
ok <- !is.na(d$cost)
cat(sprintf("Correlation (hours, cost): %s\n", if (sum(ok) < 3 || sd(d$hours[ok]) == 0 || sd(d$cost[ok]) == 0) "NA" else sprintf("%.3f", cor(d$hours[ok], d$cost[ok]))))
h <- as.integer(substr(d$start, 12, 13))
night <- h >= 22 | h < 6
if (sum(night) >= 2 && sum(!night) >= 2) {
  p <- t.test(d$hours[night], d$hours[!night], var.equal = TRUE)$p.value
  cat(sprintf("Night vs day: p-value %.4f -> %s\n", p, if (p < 0.05) "significant" else "not significant"))
} else cat("Night vs day: not enough data\n")`, r`d <- read.csv("outages.csv", stringsAsFactors = FALSE)
for (p in sort(unique(d$plant))) {
  x <- d[d$plant == p, ]
  cat(sprintf("%s: %d outages, %.1f hours, cost %s\n", p, nrow(x), sum(x$hours), format(sum(x$cost, na.rm = TRUE))))
}
ok <- !is.na(d$cost)
cat(sprintf("Correlation (hours, cost): %s\n", if (sum(ok) < 3 || sd(d$hours[ok]) == 0 || sd(d$cost[ok]) == 0) "NA" else sprintf("%.3f", cor(d$hours[ok], d$cost[ok]))))
h <- as.integer(substr(d$start, 12, 13))
night <- h >= 22 | h <= 6
if (sum(night) >= 2 && sum(!night) >= 2) {
  p <- t.test(d$hours[night], d$hours[!night])$p.value
  cat(sprintf("Night vs day: p-value %.4f -> %s\n", p, if (p < 0.05) "significant" else "not significant"))
} else cat("Night vs day: not enough data\n")`, r`d <- read.csv("outages.csv", stringsAsFactors = FALSE)
for (p in sort(unique(d$plant))) {
  x <- d[d$plant == p, ]
  cat(sprintf("%s: %d outages, %.1f hours, cost %s\n", p, nrow(x), sum(x$hours), format(sum(x$cost, na.rm = TRUE))))
}
ok <- !is.na(d$cost)
cat(sprintf("Correlation (hours, cost): %s\n", if (sum(ok) < 3 || sd(d$hours[ok]) == 0 || sd(d$cost[ok]) == 0) "NA" else sprintf("%.3f", cor(d$hours[ok], d$cost[ok]))))
h <- as.integer(substr(d$start, 12, 13))
night <- h > 22 | h < 6
if (sum(night) >= 2 && sum(!night) >= 2) {
  p <- t.test(d$hours[night], d$hours[!night])$p.value
  cat(sprintf("Night vs day: p-value %.4f -> %s\n", p, if (p < 0.05) "significant" else "not significant"))
} else cat("Night vs day: not enough data\n")`, r`d <- read.csv("outages.csv", stringsAsFactors = FALSE)
for (p in sort(unique(d$plant))) {
  x <- d[d$plant == p, ]
  cat(sprintf("%s: %d outages, %.1f hours, cost %s\n", p, nrow(x), sum(x$hours), format(sum(x$cost, na.rm = TRUE))))
}
ok <- !is.na(d$cost)
cat(sprintf("Correlation (hours, cost): %s\n", if (sum(ok) < 3 || sd(d$hours[ok]) == 0 || sd(d$cost[ok]) == 0) "NA" else sprintf("%.3f", cor(d$hours[ok], d$cost[ok]))))
h <- as.integer(substr(d$start, 12, 13))
night <- h >= 22 | h < 6
if (sum(night) >= 1 && sum(!night) >= 1) {
  p <- t.test(d$hours[night], d$hours[!night])$p.value
  cat(sprintf("Night vs day: p-value %.4f -> %s\n", p, if (p < 0.05) "significant" else "not significant"))
} else cat("Night vs day: not enough data\n")`, r`d <- read.csv("outages.csv", stringsAsFactors = FALSE)
for (p in sort(unique(d$plant))) {
  x <- d[d$plant == p, ]
  cat(sprintf("%s: %d outages, %.1f hours, cost %s\n", p, nrow(x), sum(x$hours), format(sum(x$cost, na.rm = TRUE))))
}
ok <- rep(TRUE, nrow(d)); d$cost[is.na(d$cost)] <- 0
cat(sprintf("Correlation (hours, cost): %s\n", if (sum(ok) < 3 || sd(d$hours[ok]) == 0 || sd(d$cost[ok]) == 0) "NA" else sprintf("%.3f", cor(d$hours[ok], d$cost[ok]))))
h <- as.integer(substr(d$start, 12, 13))
night <- h >= 22 | h < 6
if (sum(night) >= 2 && sum(!night) >= 2) {
  p <- t.test(d$hours[night], d$hours[!night])$p.value
  cat(sprintf("Night vs day: p-value %.4f -> %s\n", p, if (p < 0.05) "significant" else "not significant"))
} else cat("Night vs day: not enough data\n")`, r`d <- read.csv("outages.csv", stringsAsFactors = FALSE)
for (p in sort(unique(d$plant))) {
  x <- d[d$plant == p, ]
  cat(sprintf("%s: %d outages, %.1f hours, cost %s\n", p, nrow(x), sum(x$hours), format(sum(x$cost, na.rm = TRUE))))
}
ok <- !is.na(d$cost)
cat(sprintf("Correlation (hours, cost): %s\n", if (sum(ok) < 3 || sd(d$hours[ok]) == 0 || sd(d$cost[ok]) == 0) "NA" else sprintf("%.3f", cor(d$hours[ok], d$cost[ok]))))
h <- as.integer(substr(d$start, 12, 13))
night <- h >= 22 | h < 6
if (sum(night) >= 2 && sum(!night) >= 2) {
  p <- t.test(d$hours[night], d$hours[!night])$p.value
  cat(sprintf("Night vs day: p-value %.4f -> %s\n", p, if (p < 0.1) "significant" else "not significant"))
} else cat("Night vs day: not enough data\n")`, r`d <- read.csv("outages.csv", stringsAsFactors = FALSE)
for (p in sort(unique(d$plant))) {
  x <- d[d$plant == p, ]
  cat(sprintf("%s: %d outages, %.1f hours, cost %s\n", p, nrow(x), mean(x$hours), format(sum(x$cost, na.rm = TRUE))))
}
ok <- !is.na(d$cost)
cat(sprintf("Correlation (hours, cost): %s\n", if (sum(ok) < 3 || sd(d$hours[ok]) == 0 || sd(d$cost[ok]) == 0) "NA" else sprintf("%.3f", cor(d$hours[ok], d$cost[ok]))))
h <- as.integer(substr(d$start, 12, 13))
night <- h >= 22 | h < 6
if (sum(night) >= 2 && sum(!night) >= 2) {
  p <- t.test(d$hours[night], d$hours[!night])$p.value
  cat(sprintf("Night vs day: p-value %.4f -> %s\n", p, if (p < 0.05) "significant" else "not significant"))
} else cat("Night vs day: not enough data\n")`, r`d <- read.csv("outages.csv", stringsAsFactors = FALSE)
for (p in sort(unique(d$plant))) {
  x <- d[d$plant == p, ]
  cat(sprintf("%s: %d outages, %.1f hours, cost %s\n", p, nrow(x), sum(x$hours), format(sum(x$cost, na.rm = TRUE))))
}
ok <- !is.na(d$cost)
cat(sprintf("Correlation (hours, cost): %s\n", if (sum(ok) < 3 || sd(d$hours[ok]) == 0 || sd(d$cost[ok]) == 0) "NA" else sprintf("%.3f", cor(d$hours[ok], d$cost[ok], method = "spearman"))))
h <- as.integer(substr(d$start, 12, 13))
night <- h >= 22 | h < 6
if (sum(night) >= 2 && sum(!night) >= 2) {
  p <- t.test(d$hours[night], d$hours[!night])$p.value
  cat(sprintf("Night vs day: p-value %.4f -> %s\n", p, if (p < 0.05) "significant" else "not significant"))
} else cat("Night vs day: not enough data\n")`],
  },
  'boss-r-summit-b': {
    valid: [r`d <- read.csv("faults.csv", stringsAsFactors = FALSE)
for (s in sort(unique(d$site))) {
  x <- d[d$site == s, ]
  cat(sprintf("%s: %d faults, mean %.1f min, major+critical %.1f%%\n", s, nrow(x), mean(x$minutes), mean(x$severity != "minor") * 100))
}
h <- substr(d$logged, 12, 13)
tab <- table(h)
cat(sprintf("Busiest hour: %s\n", names(tab)[which.max(tab)]))
score <- c(minor = 1, major = 2, critical = 3)[d$severity]
cat(sprintf("Correlation (minutes, severity): %s\n", if (length(unique(score)) < 2 || length(unique(d$minutes)) < 2) "NA" else sprintf("%.3f", cor(d$minutes, score))))`],
    wrong: [r`d <- read.csv("faults.csv", stringsAsFactors = FALSE)
for (s in sort(unique(d$site))) {
  x <- d[d$site == s, ]
  cat(sprintf("%s: %d faults, mean %.1f min, major+critical %.1f%%\n", s, nrow(x), mean(x$minutes), mean(x$severity == "critical") * 100))
}
h <- substr(d$logged, 12, 13)
tab <- table(h)
cat(sprintf("Busiest hour: %s\n", names(tab)[which.max(tab)]))
score <- c(minor = 1, major = 2, critical = 3)[d$severity]
cat(sprintf("Correlation (minutes, severity): %s\n", if (length(unique(score)) < 2 || length(unique(d$minutes)) < 2) "NA" else sprintf("%.3f", cor(d$minutes, score))))`, r`d <- read.csv("faults.csv", stringsAsFactors = FALSE)
for (s in sort(unique(d$site))) {
  x <- d[d$site == s, ]
  cat(sprintf("%s: %d faults, mean %.1f min, major+critical %.1f%%\n", s, nrow(x), mean(x$minutes), mean(x$severity != "minor") * 100))
}
h <- substr(d$logged, 12, 13)
tab <- table(h)
cat(sprintf("Busiest hour: %s\n", names(tab)[length(tab) - which.max(rev(tab)) + 1]))
score <- c(minor = 1, major = 2, critical = 3)[d$severity]
cat(sprintf("Correlation (minutes, severity): %s\n", if (length(unique(score)) < 2 || length(unique(d$minutes)) < 2) "NA" else sprintf("%.3f", cor(d$minutes, score))))`, r`d <- read.csv("faults.csv", stringsAsFactors = FALSE)
for (s in sort(unique(d$site))) {
  x <- d[d$site == s, ]
  cat(sprintf("%s: %d faults, mean %.1f min, major+critical %.1f%%\n", s, nrow(x), mean(x$minutes), mean(x$severity != "minor") * 100))
}
h <- substr(d$logged, 12, 13)
tab <- table(h)
cat(sprintf("Busiest hour: %s\n", names(tab)[which.max(tab)]))
score <- c(minor = 0, major = 1, critical = 5)[d$severity]
cat(sprintf("Correlation (minutes, severity): %s\n", if (length(unique(score)) < 2 || length(unique(d$minutes)) < 2) "NA" else sprintf("%.3f", cor(d$minutes, score))))`, r`d <- read.csv("faults.csv", stringsAsFactors = FALSE)
for (s in sort(unique(d$site))) {
  x <- d[d$site == s, ]
  cat(sprintf("%s: %d faults, mean %.1f min, major+critical %.1f%%\n", s, nrow(x), mean(x$minutes), mean(x$severity != "minor") * 100))
}
h <- substr(d$logged, 12, 14)
tab <- table(h)
cat(sprintf("Busiest hour: %s\n", names(tab)[which.max(tab)]))
score <- c(minor = 1, major = 2, critical = 3)[d$severity]
cat(sprintf("Correlation (minutes, severity): %s\n", if (length(unique(score)) < 2 || length(unique(d$minutes)) < 2) "NA" else sprintf("%.3f", cor(d$minutes, score))))`, r`d <- read.csv("faults.csv", stringsAsFactors = FALSE)
for (s in sort(unique(d$site))) {
  x <- d[d$site == s, ]
  cat(sprintf("%s: %d faults, mean %.2f min, major+critical %.1f%%\n", s, nrow(x), mean(x$minutes), mean(x$severity != "minor") * 100))
}
h <- substr(d$logged, 12, 13)
tab <- table(h)
cat(sprintf("Busiest hour: %s\n", names(tab)[which.max(tab)]))
score <- c(minor = 1, major = 2, critical = 3)[d$severity]
cat(sprintf("Correlation (minutes, severity): %s\n", if (length(unique(score)) < 2 || length(unique(d$minutes)) < 2) "NA" else sprintf("%.3f", cor(d$minutes, score))))`, r`d <- read.csv("faults.csv", stringsAsFactors = FALSE)
for (s in sort(unique(d$site))) {
  x <- d[d$site == s, ]
  cat(sprintf("%s: %d faults, mean %.1f min, major+critical %.1f%%\n", s, nrow(x), mean(x$minutes), mean(x$severity != "minor") * 100))
}
h <- substr(d$logged, 12, 13)
tab <- table(h)
cat(sprintf("Busiest hour: %s\n", names(tab)[which.max(tab)]))
score <- c(minor = 1, major = 2, critical = 3)[d$severity]
cat(sprintf("Correlation (minutes, severity): %s\n", if (length(unique(score)) < 2 || length(unique(d$minutes)) < 2) "NA" else sprintf("%.3f", abs(cor(d$minutes, score)))))`],
  },
};
