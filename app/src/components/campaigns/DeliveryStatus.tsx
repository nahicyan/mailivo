// app/src/components/campaigns/DeliveryStatus.tsx
export function DeliveryStatus({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['campaign-delivery', campaignId],
    queryFn: () => fetchCampaignDeliveryStatus(campaignId),
    refetchInterval: 5000, // Poll every 5 seconds during sending
  });

  if (isLoading) return <Skeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DeliveryMetric
            label="Delivered"
            value={data.delivered}
            total={data.totalRecipients}
            color="green"
          />
          <DeliveryMetric
            label="Bounced"
            value={data.bounced}
            total={data.totalRecipients}
            color="red"
            details={`Hard: ${data.hardBounces}, Soft: ${data.softBounces}`}
          />
          <DeliveryMetric
            label="Pending"
            value={data.pending}
            total={data.totalRecipients}
            color="yellow"
          />
        </div>
        
        {data.bouncedEmails.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Bounced Emails</h4>
            <DataTable
              columns={bounceColumns}
              data={data.bouncedEmails}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}