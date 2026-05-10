---
sidebar_position: 4
---

# Google Cloud Pub/Sub

Pub/Sub is GCP's fully managed messaging service — the equivalent of Azure Event Hubs or AWS Kinesis. It decouples event producers from consumers and is the backbone of streaming pipelines on GCP.

---

## Core Concepts

```
Publisher (producer)
    → publishes messages to a Topic

Topic
    → holds messages until subscribers consume them

Subscription
    → a named "cursor" a consumer uses to pull messages
    → can have multiple subscriptions per topic (fan-out)

Subscriber (consumer)
    → pulls messages from a Subscription
    → OR receives messages via Push (HTTP endpoint)
```

---

## Topic and Subscription Setup

```bash
# Create a topic
gcloud pubsub topics create orders-events

# Create a pull subscription (consumer pulls messages)
gcloud pubsub subscriptions create orders-consumer \
    --topic=orders-events \
    --ack-deadline=60

# Create a push subscription (Pub/Sub pushes to HTTP endpoint)
gcloud pubsub subscriptions create orders-push \
    --topic=orders-events \
    --push-endpoint=https://my-service.run.app/ingest
```

---

## Publishing Messages (Python)

```python
from google.cloud import pubsub_v1
import json

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path("my-project", "orders-events")

# Publish a single event
message = {
    "order_id": "ORD-12345",
    "customer_id": 987,
    "amount": 149.99,
    "event_ts": "2024-01-15T10:30:00Z"
}

future = publisher.publish(
    topic_path,
    data=json.dumps(message).encode("utf-8"),
    order_id="ORD-12345",     # message attribute (for filtering)
    source="checkout-service"
)
print(f"Published: {future.result()}")
```

---

## Consuming Messages (Pull Subscriber)

```python
from google.cloud import pubsub_v1
import json

subscriber = pubsub_v1.SubscriberClient()
subscription_path = subscriber.subscription_path("my-project", "orders-consumer")

def process_message(message):
    data = json.loads(message.data.decode("utf-8"))
    print(f"Order: {data['order_id']}, Amount: {data['amount']}")
    message.ack()  # Acknowledge — removes from queue

streaming_pull_future = subscriber.subscribe(
    subscription_path, callback=process_message
)

with subscriber:
    try:
        streaming_pull_future.result(timeout=30)
    except TimeoutError:
        streaming_pull_future.cancel()
```

---

## Pub/Sub + Dataflow (Streaming Pipeline)

The most common pattern: Pub/Sub → Dataflow → BigQuery

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import json

def parse_order(message):
    return json.loads(message.decode("utf-8"))

def run():
    options = PipelineOptions(
        runner="DataflowRunner",
        project="my-project",
        region="europe-west2",
        streaming=True,
        temp_location="gs://my-temp-bucket/temp"
    )

    with beam.Pipeline(options=options) as p:
        (
            p
            | "ReadFromPubSub" >> beam.io.ReadFromPubSub(
                subscription="projects/my-project/subscriptions/orders-consumer"
            )
            | "ParseJSON" >> beam.Map(parse_order)
            | "WriteToBigQuery" >> beam.io.WriteToBigQuery(
                "my-project:gold.streaming_orders",
                schema="order_id:STRING,customer_id:INTEGER,amount:FLOAT,event_ts:TIMESTAMP",
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED
            )
        )

run()
```

---

## Pub/Sub → GCS (via Pub/Sub Subscriptions — No Code)

GCP has a built-in BigQuery and Cloud Storage subscription type — no Dataflow needed for simple cases:

```bash
# Auto-write messages to GCS as Avro/JSON (no code required)
gcloud pubsub subscriptions create orders-to-gcs \
    --topic=orders-events \
    --cloud-storage-bucket=my-data-lake \
    --cloud-storage-file-prefix=bronze/orders/ \
    --cloud-storage-max-duration=5m
```

---

## Pub/Sub vs Azure Event Hubs vs AWS Kinesis

| Feature | Pub/Sub | Event Hubs | Kinesis |
|---------|---------|------------|---------|
| Retention | 7 days (configurable to 31 days) | 1-90 days | 1-365 days |
| Ordering | Per ordering key | Per partition | Per shard |
| Throughput unit | Auto-scales | Throughput Units | Shards (manual) |
| Dead-letter | Via dead-letter topic | Via separate topic | Built-in |
| Native sink | BigQuery, GCS, Dataflow | ADLS, Databricks | S3, Lambda, Redshift |

---

## Best Practices

- Always acknowledge messages after processing — unacknowledged messages redeliver after `ack-deadline`
- Set a **dead-letter topic** for messages that repeatedly fail processing
- Use **message ordering keys** when the sequence of events matters (e.g., CDC events per row)
- Use **Pub/Sub Lite** for high-throughput, cost-sensitive workloads (zonal, no auto-scale)
- Enable **message retention** so late-starting consumers can replay events
