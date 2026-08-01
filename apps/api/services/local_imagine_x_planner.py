import uuid
from datetime import datetime, timezone
from typing import List
from apps.api.schemas.brain import (
    BrainPlanResponse,
    BrainObjective,
    BrainDelegatedTask,
    ProviderMetadata,
    ReplayAuditEvent,
    BrainProviderRoute,
    BrainGuardianCheck,
    BrainGuardianCritique,
    BrainProposal,
    RecommendationInfluenceSource,
)

ROUTE_RULES = (
    (("logo", "icon", "vector", "illustration"), "Vector Studio", "Create editable vector assets.", "Editable vector output requested."),
    (("animat", "motion", "video"), "Motion Studio", "Create motion-ready output.", "Time-based output requested."),
    (("deck", "presentation", "slides"), "Presentation Studio", "Build the presentation narrative.", "Presentation output requested."),
    (("brand", "campaign", "identity"), "Brand Studio", "Define the brand direction.", "Brand-system work requested."),
    (("photo", "image", "poster", "portrait", "product", "perfume", "fragrance"), "Photo Studio", "Create the image composition.", "Raster composition requested."),
)

def generate_local_plan(
    intent: str,
    recommendation_influences: List[str] | None = None,
    recommendation_influence_source: RecommendationInfluenceSource | None = None,
) -> BrainPlanResponse:
    recommendation_influences = recommendation_influences or []
    request_id = f"brain_plan_{uuid.uuid4().hex[:8]}"
    now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "") + "Z"
    intent_lower = intent.lower()

    matched_routes = [
        (studio, title, reason)
        for keywords, studio, title, reason in ROUTE_RULES
        if any(keyword in intent_lower for keyword in keywords)
    ]
    matches = matched_routes or [
        ("Brand Studio", "Clarify the creative direction.", "No specialized output was explicit.")
    ]

    delegated_tasks = [
        BrainDelegatedTask(
            id=f"task_{index:03d}",
            studio=studio,
            title=title,
            priority="high" if index == 1 else "medium",
            status="proposed",
        )
        for index, (studio, title, _) in enumerate(matches, start=1)
    ]
    routes = [
        BrainProviderRoute(
            taskId=task.id,
            studio=task.studio,
            provider="local-studio-router",
            mode="dry-run",
            reason=reason,
        )
        for task, (_, _, reason) in zip(delegated_tasks, matches)
    ]
    objectives = [
        BrainObjective(
            id="obj_001",
            title="Preserve the requested outcome",
            description=f"Translate the intent without changing its requested result: {intent}",
        ),
        BrainObjective(
            id="obj_002",
            title="Prepare editable studio work",
            description="Route each proposed task to the smallest capable Axiom Studio.",
        ),
    ]
    if recommendation_influences:
        objectives.append(
            BrainObjective(
                id="obj_local_preferences",
                title="Apply approved local preferences",
                description="; ".join(recommendation_influences),
            )
        )

    audit = [
        ReplayAuditEvent(
            id=f"audit_{uuid.uuid4().hex[:6]}",
            type="intent_received",
            timestamp=now_str,
            title="User intent received",
            description=f"Initial creative intent parsed: {intent}"
        ),
        ReplayAuditEvent(
            id=f"audit_{uuid.uuid4().hex[:6]}",
            type="plan_generated",
            timestamp=now_str,
            title="Local Imagine X plan generated",
            description=f"Generated {len(delegated_tasks)} dry-run studio routes; no provider execution occurred."
        )
    ]
    if recommendation_influence_source:
        audit.append(
            ReplayAuditEvent(
                id=f"audit_{uuid.uuid4().hex[:6]}",
                type="recommendation_influence_applied",
                timestamp=now_str,
                title="Local recommendation influence applied",
                description="Generated plan includes an explicitly activated local influence.",
                metadata=recommendation_influence_source.model_dump(),
            )
        )

    return BrainPlanResponse(
        requestId=request_id,
        intent=intent,
        summary=f"Local Imagine X plan for: {intent}.",
        objectives=objectives,
        delegatedTasks=delegated_tasks,
        confidence=0.92 if matched_routes else 0.82,
        provider=ProviderMetadata(
            name="local-imagine-x-planner",
            mode="local",
            version="0.2.0"
        ),
        routes=routes,
        guardian=BrainGuardianCritique(
            status="passed",
            summary="The plan is internally consistent and ready for user review.",
            checks=[
                BrainGuardianCheck(id="intent_preserved", status="passed", message="The original intent is preserved."),
                BrainGuardianCheck(id="route_coverage", status="passed", message="Every proposed task has one dry-run route."),
                BrainGuardianCheck(id="execution_safety", status="passed", message="No provider execution is authorized."),
            ],
        ),
        proposal=BrainProposal(
            id=f"proposal_{uuid.uuid4().hex[:8]}",
            status="awaiting_user_approval",
            requiresUserApproval=True,
            providerExecutionAllowed=False,
        ),
        audit=audit,
        recommendationInfluences=recommendation_influences,
        recommendationInfluenceSource=recommendation_influence_source,
    )
