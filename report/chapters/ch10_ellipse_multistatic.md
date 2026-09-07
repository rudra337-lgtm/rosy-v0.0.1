# Chapter 10: Multistatic Ellipse Geometry

## 10.1 Two-Station Constant Sum = 2a

The ellipse is one of the most fundamental curves in analytic geometry, and it acquires profound operational significance in the context of multistatic passive localization. At its core, an ellipse is defined as the locus of all points in a plane for which the sum of the distances to two fixed points, called the foci, remains constant. This constant sum is denoted as 2a, where a represents the semi-major axis of the ellipse. The mathematical definition is both simple and elegant: given two foci f₁ and f₂, any point p satisfies the condition |p − f₁| + |p − f₂| = 2a. This single equation captures the entire geometric essence of the ellipse and serves as the mathematical foundation for multistatic passive localization systems.

In a practical localization scenario, two receivers are positioned at known coordinates and serve as the foci of the ellipse. These receivers measure the total propagation distance — or equivalently the sum of ranges — from a target emitter to each receiver. If the target is located at position p, then the measured quantity is precisely the sum of the Euclidean distances from p to f₁ and from p to f₂. Since this sum equals 2a for any point on the ellipse, the target must lie somewhere on the ellipse defined by that constant sum. The major axis length 2a is therefore the critical measured parameter, and the foci positions are known from the receiver baseline geometry.

A crucial constraint governs the existence of a real ellipse: the constant sum 2a must strictly exceed the inter-station distance 2c, where c is the half-baseline separating the two foci. If 2a equals 2c, the locus degenerates into a line segment connecting the two foci. If 2a is less than 2c, no real points satisfy the distance-sum condition, and the geometry is physically impossible. This constraint has direct operational meaning: the measured range sum must be larger than the baseline distance, which is always satisfied for targets located outside the line segment joining the two receivers. For targets far from the baseline, 2a is approximately equal to 2c plus twice the perpendicular distance, ensuring the inequality holds robustly.

The semi-minor axis b of the ellipse is derived from a and c through the Pythagorean relationship b = √(a² − c²). This quantity determines the "width" of the ellipse perpendicular to the major axis. When c approaches zero — that is, when the two foci coincide — b approaches a and the ellipse becomes a perfect circle. Conversely, as c approaches a, b shrinks toward zero and the ellipse becomes increasingly elongated, approaching a line segment. The ratio e = c/a is called the eccentricity, and it quantifies the degree of elongation. An eccentricity of zero corresponds to a circle, while an eccentricity approaching one corresponds to a highly stretched ellipse.

The practical importance of this geometric framework lies in the fact that passive localization requires no transmitter at the target. The target may be an aircraft, a vehicle, a ship, or any electromagnetic emitter. The two receivers simply listen and measure the time of arrival of the signal at each station. From the difference in arrival times, one obtains a range difference, and from the sum of ranges, one obtains the ellipse constant 2a. The implementation of these distance calculations in the Palladium Null codebase is handled by the `ellipseSumM` function, which takes two focus coordinates and a point coordinate and returns the sum of Euclidean distances:

```typescript
export function ellipseSumM(f1: [number, number], f2: [number, number], p: [number, number]): number {
  const d1 = Math.hypot(p[0] - f1[0], p[1] - f1[1]);
  const d2 = Math.hypot(p[0] - f2[0], p[1] - f2[1]);
  return d1 + d2;
}
```

This function embodies the mathematical definition directly. The `Math.hypot` call computes the Euclidean distance without intermediate overflow or underflow issues, making it numerically robust for large coordinate values. The function returns a single scalar representing the range sum, which can be compared against the measured 2a to verify whether a candidate point lies on the ellipse. This verification capability is essential for both simulation and field validation.

The ellipse thus defined is not merely an abstract mathematical construct — it is a physical localization contour. Every point on the contour is a candidate position for the emitter, given the measured range sum. The uncertainty in the measurement translates directly into a band of contours rather than a single line, but the fundamental principle remains: the measured sum constrains the emitter to lie on (or near) a specific ellipse. This is the mathematical bedrock upon which multistatic passive localization is built, and it is the first concept that any engineer or analyst must internalize before proceeding to more elaborate multi-receiver geometries.

Figure: {{FIG:fig-ellipse-multistatic|Multistatic range-sum ellipse with foci at ±10 km, point on ellipse}}

---

## 10.2 Parametric Ellipse Point Generation

While the implicit definition of an ellipse through the distance-sum condition is mathematically clean, computational work and visualization require an explicit parametric representation. The parametric form expresses the coordinates of every point on the ellipse as a function of a single parameter t, which typically ranges from 0 to 2π. For an ellipse centered at the origin with foci along the x-axis, the parametric equations are:

x(t) = a · cos(t)
y(t) = b · sin(t)

where a is the semi-major axis, b is the semi-minor axis, and t is the eccentric anomaly — a parameter that sweeps out the full ellipse as it varies from 0 to 2π. The semi-minor axis b is recovered from a and c through the relation b = √(a² − c²). This parametric form has the great advantage of being computationally trivial: it requires only one cosine, one sine, and two multiplications per point. It also provides uniform coverage of the ellipse when t is sampled uniformly, although the geometric arc-length spacing between successive points is non-uniform.

The function `ellipsePoint2D` in the Palladium Null source code implements exactly this parametric generation:

```typescript
export function ellipsePoint2D(a: number, c: number, t: number): [number, number] {
  const b = Math.sqrt(Math.max(0, a * a - c * c));
  return [a * Math.cos(t), b * Math.sin(t)];
}
```

The `Math.max(0, ...)` guard ensures that the argument to the square root never becomes negative due to floating-point rounding, which could occur if a and c are nearly equal. When a equals c exactly, the ellipse degenerates to a line segment, and b becomes zero, yielding points confined to the x-axis. For slightly sub-critical cases where a is only marginally larger than c, b will be small but real, and the guard prevents NaN propagation.

The parameter t ∈ [0, 2π) is the eccentric anomaly, not to be confused with the true anomaly used in orbital mechanics, though the two are related by a well-known transformation. For our purposes, t serves as a simple angular parameter that traces the ellipse counterclockwise starting from the positive x-axis. At t = 0, the point is at (a, 0), the right vertex. At t = π/2, the point is at (0, b), the top of the minor axis. At t = π, the point is at (−a, 0), the left vertex. At t = 3π/2, the point is at (0, −b), the bottom of the minor axis. These four cardinal points fully characterize the ellipse's extent and orientation.

The behavior of the parametric form as c approaches zero deserves special attention. When c = 0, the two foci coincide at the origin, and b = √(a² − 0) = a. The parametric equations reduce to x(t) = a · cos(t), y(t) = a · sin(t), which are precisely the parametric equations of a circle of radius a. This limiting case is physically meaningful: if the two receivers are co-located, the range-sum measurement becomes twice the distance to a single point, and the locus of constant range sum is a circle. The circle is therefore a special case of the ellipse, and all ellipse theory reduces to circle theory in this limit.

Conversely, as c approaches a from below, b approaches zero, and the ellipse becomes increasingly flattened. In the limit c → a, the ellipse collapses to the line segment from (−a, 0) to (a, 0). This degenerate case corresponds to the situation where the measured range sum exactly equals the baseline distance, meaning the target lies on the line connecting the two receivers. In practice, this is an uninteresting localization scenario because the target's lateral position is completely unconstrained — the target could be anywhere along that line segment. Realistic localization requires 2a to be significantly larger than 2c, ensuring a well-formed ellipse with substantial semi-minor axis and therefore meaningful lateral discrimination.

The parametric form is indispensable for generating plots, performing Monte Carlo simulations, and computing intersection points between ellipses. When three or more receivers are available, the pairwise ellipses must be intersected, and the parametric form provides a convenient way to evaluate candidate points and check whether they satisfy the distance-sum conditions for multiple receiver pairs simultaneously. The function is implemented in `src/physics/index.ts` and is exported for use throughout the Palladium Null simulation framework.

Figure: {{FIG:fig-ellipse-param|Parametric ellipse points for a=13, c=10}}

---

## 10.3 Worked Example 10.1 — Basic Ellipse

Consider a simple multistatic geometry with two receivers positioned at f₁ = (−10, 0) km and f₂ = (+10, 0) km. The half-baseline is therefore c = 10 km. The receivers measure a constant range sum of 2a = 26 km, so the semi-major axis is a = 13 km. The goal is to compute the semi-minor axis b and to verify a specific point on the ellipse.

The semi-minor axis is computed from the fundamental relationship:

b = √(a² − c²) = √(13² − 10²) = √(169 − 100) = √69 ≈ 8.307 km

This value, approximately 8.307 km, defines the semi-minor axis and determines the "width" of the ellipse at its widest point perpendicular to the baseline. The full minor axis extends from (0, −8.307) to (0, +8.307) in the y-direction. The eccentricity of this ellipse is e = c/a = 10/13 ≈ 0.769, indicating a moderately elongated shape.

Now consider the point on the ellipse corresponding to the parametric angle t = π/2. Using the `ellipsePoint2D` function with a = 13, c = 10, and t = π/2:

x = a · cos(π/2) = 13 · 0 = 0
y = b · sin(π/2) = 8.307 · 1 = 8.307

The point is (0, 8.307) km. This is the top of the ellipse at the end of the semi-minor axis, which is geometrically expected for t = π/2.

Verification is essential to confirm correctness. The `ellipseSumM` function computes the sum of distances from this point to each focus:

Distance from (0, 8.307) to f₁ = (−10, 0):
d₁ = √((0 − (−10))² + (8.307 − 0)²) = √(10² + 8.307²) = √(100 + 69) = √169 = 13.000 km

Distance from (0, 8.307) to f₂ = (+10, 0):
d₂ = √((0 − 10)² + (8.307 − 0)²) = √((−10)² + 8.307²) = √(100 + 69) = √169 = 13.000 km

Range sum = d₁ + d₂ = 13.000 + 13.000 = 26.000 km = 2a ✓

The verification confirms that the point (0, 8.307) lies exactly on the ellipse defined by the measured range sum of 26 km. The arithmetic is exact because the point was chosen at the end of the semi-minor axis, where the symmetry of the configuration ensures that both distances are equal to a = 13 km. This is a general property: at the end of the semi-minor axis, the distance to each focus equals a, so the range sum is always 2a regardless of the specific values of a and c.

This worked example demonstrates the complete computational pipeline: from known receiver positions and measured range sum, compute a and c, derive b, generate points parametrically, and verify the results using the distance-sum function. The process is straightforward but must be executed with care to avoid arithmetic errors, particularly with square roots and squaring operations. The Palladium Null framework automates much of this pipeline, but manual verification remains essential for building intuition and catching implementation bugs.

Figure: {{FIG:fig-ellipse-param|Parametric ellipse points for a=13, c=10}}

---

## 10.4 Worked Example 10.2 — Elongated Ellipse

A more challenging case arises when the ellipse is highly elongated, as this produces significant numerical and geometric effects that must be understood. Consider receivers at f₁ = (−15, 0) km and f₂ = (+15, 0) km, giving a half-baseline of c = 15 km. The measured range sum is 2a = 40 km, so a = 20 km. This configuration produces an ellipse with eccentricity e = 15/20 = 0.75, which is substantially elongated.

The semi-minor axis is:

b = √(a² − c²) = √(20² − 15²) = √(400 − 225) = √175 = 5√7 ≈ 13.229 km

Note that b is significantly smaller than a — only about 66% of the semi-major axis — reflecting the elongation. The ellipse extends from (−20, 0) to (+20, 0) along the x-axis and from (0, −13.229) to (0, +13.229) along the y-axis.

Now consider the point at parametric angle t = π/4. Using `ellipsePoint2D(a = 20, c = 15, t = π/4)`:

x = 20 · cos(π/4) = 20 · (√2/2) ≈ 20 · 0.70711 = 14.142 km
y = 13.229 · sin(π/4) = 13.229 · (√2/2) ≈ 13.229 · 0.70711 = 9.354 km

The point is approximately (14.142, 9.354) km. This point lies in the first quadrant, well away from both the x-axis and y-axis, and represents a generic position on the ellipse that is not a cardinal point.

Verification proceeds by computing the individual distances:

Distance from (14.142, 9.354) to f₁ = (−15, 0):
d₁ = √((14.142 − (−15))² + (9.354 − 0)²) = √(29.142² + 9.354²) = √(849.3 + 87.5) = √936.8 ≈ 30.61 km

Distance from (14.142, 9.354) to f₂ = (+15, 0):
d₂ = √((14.142 − 15)² + (9.354 − 0)²) = √((−0.858)² + 9.354²) = √(0.736 + 87.5) = √88.24 ≈ 9.39 km

Range sum = d₁ + d₂ = 30.61 + 9.39 = 40.00 km = 2a ✓

The verification confirms the point lies on the ellipse to within rounding error. The asymmetry of the distances — one being about 30.6 km and the other about 9.4 km — illustrates a key property of elongated ellipses: points near the major axis exhibit large differences between the two distances, while points near the minor axis exhibit nearly equal distances. At the vertex (a, 0), one distance is a − c = 5 km and the other is a + c = 35 km, a ratio of 7:1. At the co-vertex (0, b), both distances equal a = 20 km. This variation has practical implications for time-difference-of-arrival measurements, as the range difference Δd = |d₁ − d₂| varies significantly around the ellipse.

The eccentricity e = 0.75 classifies this ellipse as highly elongated. For comparison, a circle has e = 0 and Earth's orbit has e ≈ 0.0167. Ellipses with e > 0.7 are common in passive localization scenarios where the baseline is large relative to the target range. In such cases, the ellipse provides strong lateral discrimination near the minor axis but weak discrimination near the major axis, a fact that must be accounted for in positioning accuracy analysis.

Figure: {{FIG:fig-ellipse-param|Parametric ellipse points for a=20, c=15}}

---

## 10.5 Worked Example 10.3 — Near-Degenerate Ellipse

A third worked example addresses the challenging case where the ellipse is nearly degenerate, meaning a is only slightly larger than c. This situation arises in practice when the target is approximately on the baseline extension beyond one of the receivers. Consider f₁ = (−12, 0) km and f₂ = (+12, 0) km, so c = 12 km. The measured range sum is 2a = 25 km, giving a = 12.5 km. The eccentricity is e = 12/12.5 = 0.96, extremely close to unity.

The semi-minor axis is:

b = √(a² − c²) = √(12.5² − 12²) = √(156.25 − 144) = √12.25 = 3.5 km

The semi-minor axis is only 3.5 km, dramatically smaller than the semi-major axis of 12.5 km. The ellipse is extremely flat, resembling a narrow stripe along the x-axis.

At t = π/4, `ellipsePoint2D(a = 12.5, c = 12, t = π/4)` yields:

x = 12.5 · cos(π/4) ≈ 12.5 · 0.70711 = 8.839 km
y = 3.5 · sin(π/4) ≈ 3.5 · 0.70711 = 2.475 km

Verification:

Distance from (8.839, 2.475) to f₁ = (−12, 0):
d₁ = √((8.839 + 12)² + 2.475²) = √(20.839² + 2.475²) = √(434.3 + 6.13) = √440.4 ≈ 20.986 km

Distance from (8.839, 2.475) to f₂ = (+12, 0):
d₂ = √((8.839 − 12)² + 2.475²) = √((−3.161)² + 2.475²) = √(9.992 + 6.126) = √16.118 ≈ 4.015 km

Range sum = 20.986 + 4.015 = 25.001 ≈ 25 km = 2a ✓

The near-degeneracy is evident: one distance is about 21 km and the other about 4 km, a ratio of approximately 5.2:1. The target is positioned close to the line extending from f₂ away from f₁, which is why one distance is nearly a − c = 0.5 km beyond the minimum and the other is nearly a + c = 24.5 km minus that excess. This geometry provides excellent range-difference resolution but poor cross-range resolution, a well-known trade-off in multistatic systems.

Figure: {{FIG:fig-ellipse-param|Parametric ellipse points for a=12.5, c=12}}

---

## 10.6 3D Extension: Ellipsoid of Revolution

The two-dimensional ellipse generalizes naturally to three dimensions. When the 2D ellipse is rotated about its major axis — the line joining the two foci — it sweeps out a surface of revolution called an ellipsoid of revolution, or more specifically a prolate spheroid. In three dimensions, the locus of points satisfying |p − f₁| + |p − f₂| = 2a is no longer a curve but a closed surface. Every point on this surface has the same constant range sum to the two foci, and the surface extends infinitely in the azimuthal direction around the major axis while maintaining the elliptical cross-section in any plane containing the foci.

The 3D locus equation is:

√((x + c)² + y² + z²) + √((x − c)² + y² + z²) = 2a

where f₁ = (−c, 0, 0) and f₂ = (+c, 0, 0) in Cartesian coordinates, and (x, y, z) is any point on the ellipsoid. The cross-section in the xy-plane (z = 0) is precisely the 2D ellipse studied in the previous sections. Cross-sections in any other plane containing the x-axis are also ellipses with the same a and c values. Cross-sections perpendicular to the x-axis (constant x) are circles, reflecting the rotational symmetry about the major axis.

The semi-minor axis of any elliptical cross-section containing the major axis is b = √(a² − c²), the same value as in 2D. However, in the cross-section perpendicular to the major axis at position x, the radius of the circular cross-section is b · √(1 − x²/a²). At x = 0, the radius equals b (the maximum). At x = ±a, the radius is zero (the vertices).

The 3D ellipsoid is the mathematical model for 3D passive localization. In practice, the target emitter has an unknown elevation angle as well as an azimuth angle, and the range-sum measurement constrains the emitter to lie on the ellipsoid. The elevation angle adds the third dimension and breaks the degeneracy that would otherwise exist in the 2D plane. A target at the same azimuth but different elevation will have a different range sum, so the measured 2a combined with the azimuth (from bearing measurements) uniquely determines the 3D position.

The parametric representation of the ellipsoid requires two parameters, typically denoted azimuth φ and elevation θ:

x = a · cos(φ) · cos(θ)
y = b · sin(φ) · cos(θ)
z = b · sin(θ)

Wait — this is actually a parametric form for a general ellipsoid. For the ellipsoid of revolution specifically, the correct parametric form uses the fact that cross-sections perpendicular to the x-axis are circles with variable radius. A more direct parametric form uses the same eccentric anomaly t as in 2D, plus an azimuthal angle ψ:

x = a · cos(t)
y = b · sin(t) · cos(ψ)
z = b · sin(t) · sin(ψ)

where t ∈ [0, 2π) traces the generating ellipse and ψ ∈ [0, 2π) rotates it about the x-axis. This formulation directly generalizes `ellipsePoint2D` to three dimensions and can be implemented as:

```typescript
export function ellipsePoint3D(a: number, c: number, t: number, psi: number): [number, number, number] {
  const b = Math.sqrt(Math.max(0, a * a - c * c));
  return [
    a * Math.cos(t),
    b * Math.sin(t) * Math.cos(psi),
    b * Math.sin(t) * Math.sin(psi)
  ];
}
```

This function extends the 2D `ellipsePoint2D` by adding the azimuthal rotation angle ψ. When ψ = 0, the result lies in the xy-plane; when ψ = π/2, it lies in the xz-plane. The full 3D ellipsoid is swept out as ψ varies from 0 to 2π.

The elevation angle adds the third dimension to the localization problem. In a multistatic system with two receivers, the measured range sum constrains the target to an ellipsoid. If the system also measures the elevation angle of the signal arrival (perhaps through antenna pattern interpolation or multiple elevation-angle sensors), then the target is constrained to lie on the intersection of the ellipsoid and a cone of constant elevation, yielding a curve. With a third receiver providing an additional range-sum constraint, the intersection of two ellipsoids yields a discrete set of points, typically two, of which one can be rejected by contextual information such as ground proximity or altitude bounds.

The 3D ellipsoid model is essential for realistic passive localization analysis. Real emitters are at unknown elevations, and the 2D ellipse model is an oversimplification that ignores this critical degree of freedom. The ellipsoid framework captures the full 3D geometry and provides the basis for accuracy analysis, coverage estimation, and system design in three-dimensional space.

---

## 10.7 Passive Localization Principle

The passive localization principle exploits the range-sum ellipse to determine the position of an emitter without requiring any transmitted signal from the target itself. This is in contrast to active radar, where the system transmits a signal and listens for the echo. In passive localization, the emitter is an independent source — perhaps an FM broadcast tower, a cellular phone, a Wi-Fi access point, or a military radar — and the receivers simply listen to the signals emanating from that source. The emitter need not know it is being localized, and no countermeasures are available to it beyond changing frequency or ceasing transmission.

The fundamental measurement is the time of arrival of the signal at each receiver. Given two receivers at known positions f₁ and f₂, the time difference of arrival (TDOA) yields the range difference |p − f₁| − |p − f₂|, which defines a hyperbola. The range sum |p − f₁| + |p − f₂| yields the ellipse constant 2a. Both measurements are available from the same signal if the system can resolve both the absolute time of arrival at each station (for the range sum) and the differential time (for the range difference). Together, the range sum and range difference uniquely determine the position of the target as the intersection of the corresponding ellipse and hyperbola.

With only two receivers, the measured range sum constrains the emitter to an ellipse — a one-dimensional curve in the plane. This is insufficient for a unique position fix. However, with three receivers, three ellipses can be formed (one for each pair of receivers), and their intersection yields a unique point. Specifically, the three receivers produce three pairs: (f₁, f₂), (f₁, f₃), and (f₂, f₃). Each pair defines an ellipse with the measured range sum as the constant. The three ellipses generically intersect at two points, one of which is rejected by applying additional constraints such as the target being on the ground, at a known altitude, or within a geographic region of interest.

The mathematical elegance of this approach lies in its independence from any transmitted signal at the target. The target is completely passive — it need only emit (or reflect) electromagnetic energy. This makes the system difficult to detect, difficult to jam, and inexpensive to deploy, since the receivers need not transmit and therefore require only receivers, not transceivers. The trade-off is that the system must exploit signals that already exist in the environment, which may be weak, intermittent, or in unpredictable frequency bands.

The implementation of the range-sum measurement in the Palladium Null framework uses the `ellipseSumM` function to compute the theoretical range sum for any candidate emitter position. By comparing the theoretical range sum against the measured value, the system can evaluate the likelihood of candidate positions and perform maximum-likelihood estimation. For a set of N receivers, there are N(N−1)/2 possible receiver pairs, each producing an ellipse. The intersection of all these ellipses provides a redundant and robust position estimate, with the redundancy improving accuracy and enabling integrity monitoring.

The passive localization principle has been extensively studied and documented. Wills and Griffiths provided a comprehensive treatment of passive location systems, covering time-difference, frequency-difference, and range-sum measurements, as well as the geometric implications of each. Blance et al. introduced the fundamental concepts and developed early algorithms for passive emitter location. Kaplan and Hessey covered the communications engineering foundations, including the signal processing aspects of passive localization. These references form the theoretical backbone of the multistatic ellipse framework presented in this chapter.

Figure: {{FIG:fig-multistatic-intersection|Three ellipse pairs intersecting at a source location}}

---

## 10.8 Education: Ellipse as Passive Localization Locus

The ellipse is not merely a curve in a geometry textbook — it is a localization contour that directly maps to the operational problem of finding an emitter's position. Each measured range sum defines a specific ellipse on the map, and the emitter must lie somewhere on that ellipse. This interpretation transforms the ellipse from an abstract mathematical object into a practical tool for positioning. Understanding this connection is the educational core of the multistatic concept and is essential for anyone who will work with passive localization systems.

The educational progression begins with the two-receiver case, where the range sum defines a single ellipse. The student learns that the measured quantity constrains the emitter to a curve, not a point, and that additional measurements are needed to narrow the position down. Moving to three receivers, the student discovers that three ellipses intersect at discrete points, and that ambiguity resolution requires contextual information or additional measurements. With four or more receivers, the system becomes overdetermined, and least-squares or maximum-likelihood estimation can be applied to obtain the best position estimate and its uncertainty.

Each ellipse contour represents a locus of equal range-sum, and the spacing between contours reflects the sensitivity of the measurement. Contours that are widely spaced indicate that a small change in position produces a large change in the range sum, which means the measurement is highly informative. Contours that are closely spaced indicate low sensitivity, and the position estimate will have large uncertainty in that direction. The eccentricity of the ellipse determines the orientation of the sensitivity pattern: along the minor axis, contours are widely spaced (high sensitivity), while along the major axis, contours are closely spaced (low sensitivity). This anisotropic sensitivity is a fundamental characteristic of range-sum localization and must be accounted for in system design and error analysis.

The educational framework also emphasizes the relationship between the ellipse and other localization geometries. The TDOA measurement produces a hyperbola, the range-difference measurement produces an ellipse, and the bearing measurement produces a line. Each measurement type defines a different family of curves, and the combination of multiple measurement types produces a richer set of constraints that can be intersected more effectively. The ellipse, the hyperbola, and the line are all conic sections, and their unified treatment under projective geometry provides a deeper understanding of the localization problem.

Multiple receiver pairs from a single set of receivers produce multiple ellipses that can be visualized as concentric or overlapping contours on a map. Each pair of receivers defines a different baseline direction, and the resulting ellipses are oriented differently. The intersection of ellipses from different baselines is more robust than the intersection of parallel ellipses, which may never intersect or may intersect at shallow angles that produce poor geometric dilution of precision. The optimal receiver configuration places receivers in non-collinear positions so that the baselines point in diverse directions, maximizing the angular diversity of the ellipses and improving the geometry of the intersection.

This educational concept is reinforced through simulation and visualization. The Palladium Null framework provides tools for generating ellipse contours from measured range sums, displaying them on a map, and showing their intersections. Students can experiment with different receiver placements, different range-sum measurements, and different emitter positions to build intuition about the geometry. The `ellipsePoint2D` function enables the generation of smooth ellipse curves for plotting, and the `ellipseSumM` function enables the verification that any point on the curve satisfies the distance-sum condition. Together, these tools provide a complete educational environment for understanding multistatic ellipse geometry.

Figure: {{FIG:fig-multistatic-intersection|Three ellipse pairs intersecting at a source location}}

---

## 10.9 Dual-Use Framing

The ellipse geometry presented in this chapter serves exclusively civil-defense and shelter-coverage applications within the Palladium Null framework. All outputs, computations, and visualizations are labeled "SANDBOX CIVIL DEFENSE ONLY" to emphasize that the geometric tools are developed and deployed solely for the purpose of analyzing shelter coverage, alert planning, and civil-defense communication networks. The multistatic ellipse framework is used to determine the coverage areas of broadcast transmitters relative to shelter locations, to plan the placement of emergency alert receivers, and to model the propagation of emergency broadcast signals in scenarios where active transmitter failure is a concern.

No intercept, targeting, or weapon-guidance applications are contemplated or implemented. The geometry does not support tracking of specific individuals or vehicles for surveillance purposes. The range-sum ellipses are computed for area-level coverage analysis — determining which shelters fall within the broadcast range of which transmitters — rather than for point-level localization of specific emitters. The distinction is important: civil-defense localization is concerned with whether a geographic area is covered by a communication network, not with whether a specific device is transmitting from a specific location.

The shelter-coverage application uses ellipses to model the broadcast footprint of emergency transmitters. A transmitter at a known location broadcasts an emergency alert signal. Receivers at known positions measure the signal strength and time of arrival, which can be converted to range-sum estimates. The resulting ellipses define the coverage contour of the transmitter as seen from each receiver baseline. By overlaying these ellipses on a map of shelter locations, analysts can determine which shelters are within reliable communication range and which are not. Shelters outside the coverage ellipse require supplementary communication infrastructure or pre-positioned supplies.

The alert-planning application extends this analysis to multiple transmitters and multiple receiver baselines. The intersection of ellipses from different baselines identifies regions of overlapping coverage, which are the most reliable areas for emergency communication. Regions with no overlapping coverage are identified as gaps that require mitigation. The geometric analysis provides a quantitative basis for resource allocation, ensuring that emergency communication infrastructure is deployed where it is most needed.

All software outputs from the Palladium Null framework are explicitly labeled with the "SANDBOX CIVIL DEFENSE ONLY" designation. This labeling appears in console output, log files, and any generated reports or visualizations. The designation serves as both a reminder of the intended use case and a safeguard against repurposing the tools for unauthorized applications. The framework is designed to be used in a sandbox environment — a controlled, isolated setting where civil-defense analysts can experiment with geometry and configuration without affecting operational systems.

The dual-use framing is a deliberate design choice that aligns with the mission of the Palladium Null project. The project is committed to using advanced geometric and signal-processing techniques for the protection of civilian populations, not for the enhancement of military or surveillance capabilities. The ellipse geometry is a neutral mathematical tool — it can be applied to many problems — but the Palladium Null framework applies it exclusively to civil-defense challenges. This framing ensures that the tools remain focused on their intended purpose and that the knowledge generated is used solely for the benefit of public safety and emergency preparedness.

---

## References (open)

- Wills, W.H. and Griffiths, H.D. "Passive Location Systems." IEEE Signal Processing Magazine, 2008.
- Blance, D.R. et al. "An Introduction to Passive Location Techniques." DTIC, 1996.
- Kaplan, E.D. and Hessey, H.W. *Principles of Communications Engineering*. Wiley-IEEE Press, 2008.

## Cross-references

- Chapter 9 (SNR): Signal-to-noise ratio analysis for passive reception.
- Chapter 11 (TDOA): Time-difference-of-arrival geometry and hyperbolic localization.
- Chapter 24 (Elements Tower Shelter): Shelter placement and coverage optimization.
