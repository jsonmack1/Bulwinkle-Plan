# Stripe Production Deployment Checklist

## ✅ Pre-Production Checklist

### Stripe Dashboard Setup
- [ ] Switched to Live mode in Stripe Dashboard
- [ ] Business profile completed (required for live mode)
- [ ] Bank account added for payouts
- [ ] Tax information completed
- [ ] Created production products with correct pricing
- [ ] Set up production webhook endpoint

### Environment Variables (Production)
```bash
# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product Price IDs (Live Mode)
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=price_...
```

### Testing Checklist
- [ ] Test subscription creation with live mode (use real card)
- [ ] Test webhook events are received correctly
- [ ] Test subscription cancellation works
- [ ] Test failed payment handling
- [ ] Verify customer portal functionality
- [ ] Check email notifications work correctly

### Security & Compliance
- [ ] Webhook endpoint uses HTTPS
- [ ] Webhook signature verification working
- [ ] Environment variables secured in production
- [ ] PCI compliance considerations reviewed
- [ ] Terms of Service and Privacy Policy updated

### Monitoring & Alerts
- [ ] Set up monitoring for webhook failures
- [ ] Configure alerts for failed payments
- [ ] Monitor subscription metrics in Stripe Dashboard
- [ ] Set up financial reporting/reconciliation

## 🚨 Important Notes

1. **Start Small**: Consider enabling live mode for a small group first
2. **Test with Real Cards**: Use real payment methods to test the full flow
3. **Monitor Closely**: Watch for any webhook or payment failures
4. **Have Rollback Plan**: Keep test mode accessible if issues arise
5. **Customer Support**: Be ready to handle payment-related inquiries

## 📞 Emergency Contacts
- Stripe Support: [support.stripe.com](https://support.stripe.com)
- Your development team contact information
- System administrator contacts

## 🔄 Post-Launch Tasks
- [ ] Monitor first few transactions closely
- [ ] Verify payouts are working correctly
- [ ] Update documentation with live mode details
- [ ] Train customer support on payment issues
- [ ] Schedule regular reconciliation process